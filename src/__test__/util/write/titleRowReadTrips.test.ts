import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import {
  clearGasGlobals,
  makeLoggedSheet,
} from "../transaction/transactionTestClient";

type TitleCountingSheet = {
  sheet: any;
  titleReads: () => number;
  resetTitleReads: () => void;
  snapshot: () => unknown[][];
};

const makeTitleCountingSheet = (
  name: string,
  initial: unknown[][],
): TitleCountingSheet => {
  const logged = makeLoggedSheet(name, initial);
  const base: any = logged.sheet;
  let titleReadCount = 0;
  const sheet: any = {
    ...base,
    getRange: (row: number, col: number, numRows: number, numCols: number) => {
      const range = base.getRange(row, col, numRows, numCols);
      return {
        ...range,
        getValues: () => {
          if (row === 1 && numRows === 1) titleReadCount += 1;
          return range.getValues();
        },
      };
    },
  };
  return {
    sheet,
    titleReads: () => titleReadCount,
    resetTitleReads: () => {
      titleReadCount = 0;
    },
    snapshot: logged.snapshot,
  };
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

const buildEnv = () => {
  const users = makeTitleCountingSheet("Users", [
    ["id", "name", "age"],
    [1, "Alice", 20],
    [2, "Bob", 30],
  ]);
  const sheets = [users.sheet];
  const spreadsheet: any = {
    getId: () => "title-read-trips-test",
    getSheets: () => sheets,
    getSheetByName: (n: string) =>
      sheets.find((s: any) => s.getName() === n) ?? null,
  };
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
  });
  const client = new GassmaClient();
  users.resetTitleReads();
  return { client, users };
};

afterEach(() => {
  clearGasGlobals();
});

describe("書き込み系の見出し行読み取り回数", () => {
  test("create 1件は見出し行を1回だけ読む", () => {
    const env = buildEnv();
    const result = sheetOf(env.client, "Users").create({
      data: { id: 3, name: "Carol", age: 40 },
    });
    expect(result).toEqual({ id: 3, name: "Carol", age: 40 });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "Carol", 40],
    ]);
    expect(env.users.titleReads()).toBe(1);
  });

  test("createMany 3件でも見出し行は1回だけ読む", () => {
    const env = buildEnv();
    const result = sheetOf(env.client, "Users").createMany({
      data: [
        { id: 3, name: "Carol", age: 40 },
        { id: 4, name: "Dave", age: 50 },
        { id: 5, name: "Eve", age: 60 },
      ],
    });
    expect(result).toEqual({ count: 3 });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "Carol", 40],
      [4, "Dave", 50],
      [5, "Eve", 60],
    ]);
    expect(env.users.titleReads()).toBe(1);
  });

  test("createMany 10件でも見出し行は1回だけ読む", () => {
    const env = buildEnv();
    const rows = Array.from({ length: 10 }, (_, index) => ({
      id: 10 + index,
      name: `User${index}`,
      age: 20 + index,
    }));
    const result = sheetOf(env.client, "Users").createMany({ data: rows });
    expect(result).toEqual({ count: 10 });
    expect(env.users.snapshot()).toHaveLength(13);
    expect(env.users.titleReads()).toBe(1);
  });

  test("update 1件は見出し行を1回だけ読む", () => {
    const env = buildEnv();
    const result = sheetOf(env.client, "Users").update({
      where: { id: 1 },
      data: { age: 21 },
    });
    expect(result).toEqual({ id: 1, name: "Alice", age: 21 });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 21],
      [2, "Bob", 30],
    ]);
    expect(env.users.titleReads()).toBe(1);
  });

  test("update: where 不一致でも見出し行は1回だけ読む", () => {
    const env = buildEnv();
    const result = sheetOf(env.client, "Users").update({
      where: { id: 999 },
      data: { age: 21 },
    });
    expect(result).toBeNull();
    expect(env.users.titleReads()).toBe(1);
  });

  test("upsert(更新分岐)の見出し行読みは3回のまま増えない", () => {
    const env = buildEnv();
    sheetOf(env.client, "Users").upsert({
      where: { id: 1 },
      create: { id: 1, name: "Alice", age: 20 },
      update: { age: 21 },
    });
    expect(env.users.titleReads()).toBe(3);
  });

  test("upsert(作成分岐)の見出し行読みは3回のまま増えない", () => {
    const env = buildEnv();
    sheetOf(env.client, "Users").upsert({
      where: { id: 99 },
      create: { id: 99, name: "Zed", age: 1 },
      update: { age: 21 },
    });
    expect(env.users.titleReads()).toBe(3);
  });

  test("updateMany は見出し行を1回だけ読む", () => {
    const env = buildEnv();
    const result = sheetOf(env.client, "Users").updateMany({
      where: { age: 20 },
      data: { age: 21 },
    });
    expect(result).toEqual({ count: 1 });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 21],
      [2, "Bob", 30],
    ]);
    expect(env.users.titleReads()).toBe(1);
  });
});
