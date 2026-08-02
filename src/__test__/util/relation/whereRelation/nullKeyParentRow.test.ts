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
    ["", "NoKey"],
    [2, "Bob"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Post A"],
  ]),
  makeSheet("Articles", [
    ["id", "authorId", "published"],
    [201, 1, true],
    [202, 2, false],
  ]),
  makeSheet("Drafts", [["id", "authorId", "published"]]),
  makeSheet("Tags", [
    ["id", "name"],
    [10, "Tech"],
  ]),
  makeSheet("UserTags", [
    ["userId", "tagId"],
    [1, 10],
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
    post: {
      type: "oneToOne",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
    articles: {
      type: "oneToMany",
      to: "Articles",
      field: "id",
      reference: "authorId",
    },
    drafts: {
      type: "oneToMany",
      to: "Drafts",
      field: "id",
      reference: "authorId",
    },
    tags: {
      type: "manyToMany",
      to: "Tags",
      field: "id",
      reference: "id",
      through: {
        sheet: "UserTags",
        field: "userId",
        reference: "tagId",
      },
    },
  },
};

const isGassmaController = (value: unknown): value is GassmaController =>
  typeof value === "object" &&
  value !== null &&
  "findMany" in value &&
  typeof value.findMany === "function";

const usersOf = (client: GassmaClient): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record.Users;
  if (!isGassmaController(controller)) {
    throw new Error("controller not found: Users");
  }
  return controller;
};

const alice = { id: 1, name: "Alice" };
const noKey = { id: null, name: "NoKey" };
const bob = { id: 2, name: "Bob" };

describe("自キー列が null の親もリレーションの否定形フィルタに含まれる（統合）", () => {
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

  describe("oneToOne（非FK側）", () => {
    it("is: null は自キーが null の親も返す（シート順）", () => {
      const result = usersOf(client).findMany({
        where: { post: { is: null } },
      });

      expect(result).toEqual([noKey, bob]);
    });

    it("null ショートハンドも同様に返す（シート順）", () => {
      const result = usersOf(client).findMany({
        where: { post: null },
      });

      expect(result).toEqual([noKey, bob]);
    });

    it("isNot: null は自キーが null の親を返さない（非回帰）", () => {
      const result = usersOf(client).findMany({
        where: { post: { isNot: null } },
      });

      expect(result).toEqual([alice]);
    });

    it("is: 条件付きは自キーが null の親を返さない（非回帰）", () => {
      const result = usersOf(client).findMany({
        where: { post: { is: { title: "Post A" } } },
      });

      expect(result).toEqual([alice]);
    });
  });

  describe("oneToMany", () => {
    it("none は自キーが null の親も返す（シート順）", () => {
      const result = usersOf(client).findMany({
        where: { articles: { none: { published: true } } },
      });

      expect(result).toEqual([noKey, bob]);
    });

    it("every は自キーが null の親も返す（vacuous truth・シート順）", () => {
      const result = usersOf(client).findMany({
        where: { articles: { every: { published: true } } },
      });

      expect(result).toEqual([alice, noKey]);
    });

    it("子シートが空でも every は全親を返す（シート順）", () => {
      const result = usersOf(client).findMany({
        where: { drafts: { every: { published: true } } },
      });

      expect(result).toEqual([alice, noKey, bob]);
    });

    it("some は自キーが null の親を返さない（非回帰）", () => {
      const result = usersOf(client).findMany({
        where: { articles: { some: { published: true } } },
      });

      expect(result).toEqual([alice]);
    });
  });

  describe("manyToMany", () => {
    it("none は自キーが null の親も返す（シート順）", () => {
      const result = usersOf(client).findMany({
        where: { tags: { none: { name: "Tech" } } },
      });

      expect(result).toEqual([noKey, bob]);
    });

    it("every は自キーが null の親も返す（vacuous truth・シート順）", () => {
      const result = usersOf(client).findMany({
        where: { tags: { every: { name: "Tech" } } },
      });

      expect(result).toEqual([alice, noKey, bob]);
    });

    it("some は自キーが null の親を返さない（非回帰）", () => {
      const result = usersOf(client).findMany({
        where: { tags: { some: { name: "Tech" } } },
      });

      expect(result).toEqual([alice]);
    });
  });

  describe("通常条件との組み合わせ", () => {
    it("none と通常条件の AND でも順序が保たれる", () => {
      const result = usersOf(client).findMany({
        where: {
          name: { in: ["Alice", "NoKey", "Bob"] },
          articles: { none: { published: true } },
        },
      });

      expect(result).toEqual([noKey, bob]);
    });
  });
});
