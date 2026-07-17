import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";

type MockRange = {
  getValues: () => unknown[][];
  setValues: (values: unknown[][]) => void;
};

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => MockRange;
  getDataRange: () => { getValues: () => unknown[][] };
  deleteRow: (rowIndex: number) => void;
};

const makeSheet = (name: string, initial: unknown[][]): MockSheet => {
  const data = initial.map((row) => [...row]);
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
    getRange: (row, col, numRows, numCols) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values) => {
        values.forEach((rowValues, i) => {
          while (data.length < row + i) {
            data.push(Array(data[0].length).fill(""));
          }
          rowValues.forEach((value, j) => {
            data[row - 1 + i][col - 1 + j] = value;
          });
        });
      },
    }),
    getDataRange: () => ({ getValues: () => data }),
    deleteRow: (rowIndex) => {
      data.splice(rowIndex - 1, 1);
    },
  };
};

const buildClient = (): GassmaClient => {
  const sheets = [
    makeSheet("Users", [
      ["id", "name", "email"],
      [1, "Alice", "a@example.com"],
      [2, "Bob", "b@example.com"],
    ]),
  ];
  const mockSpreadsheet = {
    getId: () => "test-spreadsheet",
    getSheets: () => sheets,
    getSheetByName: (name: string) =>
      sheets.find((sheet) => sheet.getName() === name) ?? null,
  };
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
  });
  return new GassmaClient();
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

describe("upsert / delete の select + omit 同時指定", () => {
  let client: GassmaClient;

  beforeEach(() => {
    client = buildClient();
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  describe("upsert", () => {
    it("update経路: select と omit の同時指定でエラーを投げる", () => {
      expect(() =>
        sheetOf(client, "Users").upsert({
          where: { id: 1 },
          create: { id: 1, name: "never", email: "x@example.com" },
          update: { name: "Alice2" },
          select: { name: true },
          omit: { email: true },
        }),
      ).toThrow("Cannot use both select and omit in the same query");
    });

    it("create経路: select と omit の同時指定でエラーを投げる", () => {
      expect(() =>
        sheetOf(client, "Users").upsert({
          where: { id: 99 },
          create: { id: 99, name: "Carol", email: "c@example.com" },
          update: { name: "never" },
          select: { name: true },
          omit: { email: true },
        }),
      ).toThrow("Cannot use both select and omit in the same query");
    });

    it("エラー時はシートに書き込まれない", () => {
      expect(() =>
        sheetOf(client, "Users").upsert({
          where: { id: 99 },
          create: { id: 99, name: "Carol", email: "c@example.com" },
          update: { name: "never" },
          select: { name: true },
          omit: { email: true },
        }),
      ).toThrow("Cannot use both select and omit in the same query");

      expect(sheetOf(client, "Users").findMany({})).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("select と omit の同時指定でエラーを投げる", () => {
      expect(() =>
        sheetOf(client, "Users").delete({
          where: { id: 1 },
          select: { name: true },
          omit: { email: true },
        }),
      ).toThrow("Cannot use both select and omit in the same query");
    });

    it("エラー時はレコードが削除されない", () => {
      expect(() =>
        sheetOf(client, "Users").delete({
          where: { id: 1 },
          select: { name: true },
          omit: { email: true },
        }),
      ).toThrow("Cannot use both select and omit in the same query");

      expect(sheetOf(client, "Users").findMany({})).toHaveLength(2);
    });
  });

  describe("非回帰", () => {
    it("upsert: select のみは従来通り動く", () => {
      const result = sheetOf(client, "Users").upsert({
        where: { id: 1 },
        create: { id: 1, name: "never", email: "x@example.com" },
        update: { name: "Alice2" },
        select: { id: true, name: true },
      });

      expect(result).toEqual({ id: 1, name: "Alice2" });
    });

    it("upsert: omit のみは従来通り動く", () => {
      const result = sheetOf(client, "Users").upsert({
        where: { id: 1 },
        create: { id: 1, name: "never", email: "x@example.com" },
        update: { name: "Alice2" },
        omit: { email: true },
      });

      expect(result).toEqual({ id: 1, name: "Alice2" });
    });

    it("delete: select のみは従来通り動く", () => {
      const result = sheetOf(client, "Users").delete({
        where: { id: 2 },
        select: { name: true },
      });

      expect(result).toEqual({ name: "Bob" });
      expect(sheetOf(client, "Users").findMany({})).toHaveLength(1);
    });

    it("delete: omit のみは従来通り動く", () => {
      const result = sheetOf(client, "Users").delete({
        where: { id: 2 },
        omit: { email: true },
      });

      expect(result).toEqual({ id: 2, name: "Bob" });
      expect(sheetOf(client, "Users").findMany({})).toHaveLength(1);
    });
  });
});
