import { GassmaUnknownArgumentError } from "../../../errors/argument/argumentError";
import { GassmaClient } from "../../../gassma";
import type { GassmaController } from "../../../gassmaController";
import type { RelationsConfig } from "../../../types/relationTypes";

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

const titleReadCounts: Record<string, number> = {};

const makeSheet = (name: string, data: unknown[][]): MockSheet => ({
  getName: () => name,
  getLastRow: () => data.length,
  getLastColumn: () => data[0].length,
  getRange: (row, col, numRows, numCols) => {
    if (row === 1 && numRows === 1) {
      titleReadCounts[name] = (titleReadCounts[name] ?? 0) + 1;
    }
    return {
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
    };
  },
  getDataRange: () => ({ getValues: () => data }),
});

const sheets = [
  makeSheet("Users", [
    ["id", "名前", "年齢", "住所"],
    [1, "Alice", 20, "Tokyo"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Alice post"],
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

describe("設定に書かれた列名の起動時検証（統合）", () => {
  beforeAll(() => {
    Object.assign(globalThis, {
      SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
    });
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  beforeEach(() => {
    Object.keys(titleReadCounts).forEach((key) => {
      delete titleReadCounts[key];
    });
  });

  it("defaults の列名 typo はクライアント構築時にエラーを投げる", () => {
    expect(
      () => new GassmaClient({ defaults: { Users: { 年齢: 0, 住処: "" } } }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  it("updatedAt の列名 typo はクライアント構築時にエラーを投げる", () => {
    expect(() => new GassmaClient({ updatedAt: { Users: "住処" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  it("autoincrement の列名 typo はクライアント構築時にエラーを投げる", () => {
    expect(() => new GassmaClient({ autoincrement: { Posts: "iid" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  it("ignore の列名 typo はクライアント構築時にエラーを投げる", () => {
    expect(() => new GassmaClient({ ignore: { Posts: "titel" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  it("omit の列名 typo はクライアント構築時にエラーを投げる", () => {
    expect(
      () => new GassmaClient({ omit: { Users: { 名前まえ: true } } }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  it("map の値(シート実列名)の typo はクライアント構築時にエラーを投げる", () => {
    expect(
      () => new GassmaClient({ map: { Users: { address: "住処" } } }),
    ).toThrow("Unknown argument `住処`. Did you mean `住所`?");
  });

  it("正しい設定ならクライアントを構築でき、defaults が効く", () => {
    const client = new GassmaClient({
      defaults: { Users: { 年齢: 0 } },
      updatedAt: { Posts: "title" },
      autoincrement: { Users: "id" },
    });

    const users = sheetOf(client, "Users").findMany({});

    expect(users).toEqual([{ id: 1, 名前: "Alice", 年齢: 20, 住所: "Tokyo" }]);
  });

  it("map 使用時はコード名で設定を書ける", () => {
    expect(
      () =>
        new GassmaClient({
          map: { Users: { address: "住所" } },
          defaults: { Users: { address: "" } },
        }),
    ).not.toThrow();
  });

  it("ignore された列でも実在すれば defaults に書ける", () => {
    expect(
      () =>
        new GassmaClient({
          ignore: { Users: "年齢" },
          defaults: { Users: { 年齢: 0 } },
        }),
    ).not.toThrow();
  });

  it("設定なしなら検証は走らずクライアントを構築できる", () => {
    expect(() => new GassmaClient()).not.toThrow();
    expect(titleReadCounts).toEqual({});
  });

  it("relations と設定が同じシートを指しても起動時の見出し読みは各シート1回", () => {
    const client = new GassmaClient({
      relations,
      defaults: { Users: { 年齢: 0 } },
      autoincrement: { Posts: "id" },
    });

    expect(titleReadCounts).toEqual({ Users: 1, Posts: 1 });
    expect(sheetOf(client, "Users")).toBeDefined();
  });

  it("設定に登場しないシートの見出しは起動時に読まない", () => {
    new GassmaClient({ defaults: { Users: { 年齢: 0 } } });

    expect(titleReadCounts).toEqual({ Users: 1 });
  });
});
