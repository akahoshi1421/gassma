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
    [2, "Bob"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Post A"],
    [102, "", "Post B"],
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
  },
  Posts: {
    author: {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
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

const postA = { id: 101, authorId: 1, title: "Post A" };
const postB = { id: 102, authorId: null, title: "Post B" };

describe("isNot は関連が存在しない行(FK null)も返す（統合）", () => {
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

  describe("manyToOne（FK側）", () => {
    it("isNot: 条件付きは FK null の行も返す", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: { isNot: { name: "Alice" } } },
      });

      expect(result).toEqual([postB]);
    });

    it("isNot: {} は FK null の行だけを返す", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: { isNot: {} } },
      });

      expect(result).toEqual([postB]);
    });

    it("全員に合致しない条件の isNot は全行を返す", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: { isNot: { name: "Unknown" } } },
      });

      expect(result).toEqual([postA, postB]);
    });

    it("is: 条件付きは変わらない（非回帰）", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: { is: { name: "Alice" } } },
      });

      expect(result).toEqual([postA]);
    });

    it("null ショートハンドは変わらない（非回帰）", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: null },
      });

      expect(result).toEqual([postB]);
    });

    it("notIn 単体は null 行を返さない（非回帰）", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { authorId: { notIn: [1] } },
      });

      expect(result).toEqual([]);
    });

    it("通常条件と組み合わせられる", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { title: "Post B", author: { isNot: { name: "Alice" } } },
      });

      expect(result).toEqual([postB]);
    });
  });

  describe("oneToOne（非FK側）", () => {
    it("isNot: 条件付きは関連を持たない親も返す", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { post: { isNot: { title: "Post A" } } },
      });

      expect(result).toEqual([{ id: 2, name: "Bob" }]);
    });

    it("isNot: {} は関連を持たない親だけを返す", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { post: { isNot: {} } },
      });

      expect(result).toEqual([{ id: 2, name: "Bob" }]);
    });

    it("is: 条件付きは変わらない（非回帰）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { post: { is: { title: "Post A" } } },
      });

      expect(result).toEqual([{ id: 1, name: "Alice" }]);
    });
  });
});
