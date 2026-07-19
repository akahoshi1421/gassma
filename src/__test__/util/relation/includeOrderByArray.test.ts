import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import type {
  IncludeData,
  RelationsConfig,
} from "../../../types/relationTypes";

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
    [2, "Bob"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "B"],
    [102, 1, "A"],
    [103, 1, "B"],
    [104, 2, "C"],
  ]),
  makeSheet("Comments", [
    ["id", "postId", "body"],
    [201, 101, "Nice"],
    [202, 101, "Great"],
    [203, 101, "Nice"],
  ]),
  makeSheet("Categories", [
    ["id", "name"],
    [401, "Tech"],
    [402, "Life"],
    [403, "Tech"],
  ]),
  makeSheet("PostCategories", [
    ["postId", "categoryId"],
    [101, 401],
    [101, 402],
    [101, 403],
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
    },
  },
  Posts: {
    comments: {
      type: "oneToMany",
      to: "Comments",
      field: "id",
      reference: "postId",
    },
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

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!(controller instanceof GassmaController)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

describe("include 内 orderBy 配列（統合）", () => {
  let client: GassmaClient;

  beforeAll(() => {
    Object.assign(globalThis, {
      SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
    });
    client = new GassmaClient({ relations });
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  describe("include の orderBy 配列", () => {
    it("複数エントリの第2キーがタイブレークとして効く", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { orderBy: [{ title: "asc" }, { id: "desc" }] } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          posts: [
            { id: 102, authorId: 1, title: "A" },
            { id: 103, authorId: 1, title: "B" },
            { id: 101, authorId: 1, title: "B" },
          ],
        },
      ]);
    });

    it("単一 object の orderBy は安定ソートのまま（対比）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { orderBy: { title: "asc" } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          posts: [
            { id: 102, authorId: 1, title: "A" },
            { id: 101, authorId: 1, title: "B" },
            { id: 103, authorId: 1, title: "B" },
          ],
        },
      ]);
    });

    it("空配列は並び順を変えない（no-op）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { orderBy: [] } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          posts: [
            { id: 101, authorId: 1, title: "B" },
            { id: 102, authorId: 1, title: "A" },
            { id: 103, authorId: 1, title: "B" },
          ],
        },
      ]);
    });

    it("manyToMany でも配列のタイブレークが効く", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { id: 101 },
        include: {
          categories: { orderBy: [{ name: "asc" }, { id: "desc" }] },
        },
      });

      expect(result).toEqual([
        {
          id: 101,
          authorId: 1,
          title: "B",
          categories: [
            { id: 402, name: "Life" },
            { id: 403, name: "Tech" },
            { id: 401, name: "Tech" },
          ],
        },
      ]);
    });

    it("ネストした include 内でも配列が使える", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: {
          posts: {
            where: { id: 101 },
            include: {
              comments: { orderBy: [{ body: "asc" }, { id: "desc" }] },
            },
          },
        },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          posts: [
            {
              id: 101,
              authorId: 1,
              title: "B",
              comments: [
                { id: 202, postId: 101, body: "Great" },
                { id: 203, postId: 101, body: "Nice" },
                { id: 201, postId: 101, body: "Nice" },
              ],
            },
          ],
        },
      ]);
    });

    it("配列要素が object 以外の場合はエラーを投げる", () => {
      const include = {
        posts: { orderBy: ["invalid"] },
      } as unknown as IncludeData;

      expect(() =>
        sheetOf(client, "Users").findMany({ where: { id: 1 }, include }),
      ).toThrow(
        'Include "posts": option "orderBy" must be an object or an array of objects',
      );
    });
  });

  describe("select 内 relation の orderBy 配列", () => {
    it("複数エントリの第2キーがタイブレークとして効く", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: {
          posts: {
            orderBy: [{ title: "asc" }, { id: "desc" }],
            select: { id: true, title: true },
          },
        },
      });

      expect(result).toEqual([
        {
          posts: [
            { id: 102, title: "A" },
            { id: 103, title: "B" },
            { id: 101, title: "B" },
          ],
        },
      ]);
    });

    it("空配列は並び順を変えない（no-op）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: { posts: { orderBy: [], select: { id: true } } },
      });

      expect(result).toEqual([
        { posts: [{ id: 101 }, { id: 102 }, { id: 103 }] },
      ]);
    });
  });
});
