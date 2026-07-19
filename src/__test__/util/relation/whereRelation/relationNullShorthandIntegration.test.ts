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
    [3, "Carol"],
  ]),
  makeSheet("Profiles", [
    ["id", "userId", "bio"],
    [301, 1, "Alice bio"],
    [302, 2, "Bob bio"],
    [303, "", "orphan bio"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [401, 1, "Alice post"],
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
    profile: {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    },
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
  },
  Profiles: {
    user: {
      type: "manyToOne",
      to: "Users",
      field: "userId",
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

describe("where 直値 null ショートハンド（統合）", () => {
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
    it("直値 null は is: null と同じ結果を返す", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { profile: null },
      });

      expect(result).toEqual([{ id: 3, name: "Carol" }]);
    });

    it("通常条件と組み合わせられる", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { name: "Carol", profile: null },
      });

      expect(result).toEqual([{ id: 3, name: "Carol" }]);
    });

    it("AND 内で機能する", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { AND: [{ profile: null }] },
      });

      expect(result).toEqual([{ id: 3, name: "Carol" }]);
    });

    it("OR 内で機能する", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { OR: [{ profile: null }, { name: "Alice" }] },
      });

      expect(result).toEqual([
        { id: 3, name: "Carol" },
        { id: 1, name: "Alice" },
      ]);
    });

    it("NOT 内で機能する（関連を持つ親のみ返る）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { NOT: { profile: null } },
      });

      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });
  });

  describe("manyToOne（FK側）", () => {
    it("直値 null は FK が null の行を返す", () => {
      const result = sheetOf(client, "Profiles").findMany({
        where: { user: null },
      });

      expect(result).toEqual([{ id: 303, userId: null, bio: "orphan bio" }]);
    });

    it("NOT 内で機能する（FK が null でない行を返す）", () => {
      const result = sheetOf(client, "Profiles").findMany({
        where: { NOT: { user: null } },
      });

      expect(result).toEqual([
        { id: 301, userId: 1, bio: "Alice bio" },
        { id: 302, userId: 2, bio: "Bob bio" },
      ]);
    });
  });

  describe("list リレーション", () => {
    it("oneToMany への直値 null はエラーを投げる", () => {
      expect(() =>
        sheetOf(client, "Users").findMany({ where: { posts: null } }),
      ).toThrow(
        'Filter "null" cannot be used on relation "posts" of type "oneToMany"',
      );
    });
  });
});
