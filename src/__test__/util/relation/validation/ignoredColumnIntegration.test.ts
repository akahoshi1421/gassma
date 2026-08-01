import { RelationIgnoredColumnError } from "../../../../errors/relation/relationValidationError";
import { GassmaClient } from "../../../../gassma";
import type { GassmaController } from "../../../../gassmaController";
import type { RelationsConfig } from "../../../../types/relationTypes";

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => { getValues: () => unknown[][] };
  getDataRange: () => { getValues: () => unknown[][] };
};

const makeSheet = (name: string, data: unknown[][]): MockSheet => ({
  getName: () => name,
  getLastRow: () => data.length,
  getLastColumn: () => data[0].length,
  getRange: (row, col, numRows, numCols) => ({
    getValues: () =>
      data
        .slice(row - 1, row - 1 + numRows)
        .map((r) => r.slice(col - 1, col - 1 + numCols)),
  }),
  getDataRange: () => ({ getValues: () => data }),
});

const sheets = [
  makeSheet("Users", [
    ["id", "name"],
    [1, "Alice"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Alice post"],
  ]),
  makeSheet("Categories", [
    ["id", "name"],
    [201, "tech"],
  ]),
  makeSheet("PostCategories", [
    ["postId", "categoryId"],
    [101, 201],
  ]),
];

const mockSpreadsheet = {
  getId: () => "test-spreadsheet",
  getSheets: () => sheets,
  getSheetByName: (name: string) =>
    sheets.find((sheet) => sheet.getName() === name) ?? null,
};

const relations: RelationsConfig = {
  Users: {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
      onDelete: "SetNull",
    },
  },
  Posts: {
    categories: {
      type: "manyToMany",
      to: "Categories",
      field: "id",
      reference: "id",
      through: {
        sheet: "PostCategories",
        field: "postId",
        reference: "categoryId",
      },
    },
  },
};

const isGassmaController = (value: unknown): value is GassmaController =>
  typeof value === "object" &&
  value !== null &&
  "findMany" in value &&
  typeof value.findMany === "function";

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!isGassmaController(controller)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

describe("無視列を使うリレーション定義の起動時拒否（統合）", () => {
  beforeAll(() => {
    Object.assign(globalThis, {
      SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
    });
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  it("reference が相手シートで無視されているとクライアント構築時にエラーを投げる", () => {
    expect(
      () => new GassmaClient({ relations, ignore: { Posts: "authorId" } }),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("field が自シートで無視されているとクライアント構築時にエラーを投げる", () => {
    expect(
      () => new GassmaClient({ relations, ignore: { Users: ["id"] } }),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("through.field が中間シートで無視されているとクライアント構築時にエラーを投げる", () => {
    expect(
      () =>
        new GassmaClient({ relations, ignore: { PostCategories: "postId" } }),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("リレーションに関係ない列の無視ならクライアントを構築できる", () => {
    const client = new GassmaClient({
      relations,
      ignore: { Users: "name", Posts: ["title"] },
    });

    const posts = sheetOf(client, "Posts").findMany({});

    expect(posts).toEqual([{ id: 101, authorId: 1 }]);
  });

  it("無視設定がなければクライアントを構築できる", () => {
    expect(() => new GassmaClient({ relations })).not.toThrow();
  });
});
