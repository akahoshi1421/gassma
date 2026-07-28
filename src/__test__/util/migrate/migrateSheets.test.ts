import { GassmaMissingArgumentError } from "../../../errors/argument/argumentError";
import { migrateSheets } from "../../../util/migrate/migrateSheets";

type SetValuesCall = {
  row: number;
  col: number;
  numRows: number;
  numCols: number;
  values: unknown[][];
};

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
};

type SheetHandle = {
  sheet: MockSheet;
  snapshot: () => unknown[][];
  writes: SetValuesCall[];
};

const makeSheet = (name: string, initial: unknown[][]): SheetHandle => {
  const data = initial.map((row) => [...row]);
  const writes: SetValuesCall[] = [];
  const width = () => (data[0] ? data[0].length : 0);
  const sheet: MockSheet = {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => width(),
    getRange: (row, col, numRows, numCols) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values) => {
        writes.push({ row, col, numRows, numCols, values });
        values.forEach((rowValues, i) => {
          while (data.length < row + i) data.push([]);
          rowValues.forEach((value, j) => {
            data[row - 1 + i][col - 1 + j] = value;
          });
        });
      },
    }),
  };
  return { sheet, snapshot: () => data.map((row) => [...row]), writes };
};

type MockSpreadsheet = {
  getId: () => string;
  getSheets: () => MockSheet[];
  getSheetByName: (name: string) => MockSheet | null;
  insertSheet: (name: string) => MockSheet;
};

type SpreadsheetHandle = {
  spreadsheet: MockSpreadsheet;
  handleOf: (name: string) => SheetHandle;
  insertedNames: string[];
  sheetNames: () => string[];
};

const makeSpreadsheet = (
  id: string,
  handles: SheetHandle[],
): SpreadsheetHandle => {
  const all = [...handles];
  const insertedNames: string[] = [];
  const spreadsheet: MockSpreadsheet = {
    getId: () => id,
    getSheets: () => all.map((handle) => handle.sheet),
    getSheetByName: (name) =>
      all.find((handle) => handle.sheet.getName() === name)?.sheet ?? null,
    insertSheet: (name) => {
      if (all.some((handle) => handle.sheet.getName() === name)) {
        throw new Error(`A sheet with the name "${name}" already exists.`);
      }
      const handle = makeSheet(name, []);
      all.push(handle);
      insertedNames.push(name);
      return handle.sheet;
    },
  };
  const handleOf = (name: string): SheetHandle => {
    const found = all.find((handle) => handle.sheet.getName() === name);
    if (!found) throw new Error(`mock sheet not found: ${name}`);
    return found;
  };
  return {
    spreadsheet,
    handleOf,
    insertedNames,
    sheetNames: () => all.map((handle) => handle.sheet.getName()),
  };
};

const installSpreadsheetApp = (
  active: SpreadsheetHandle,
  byId: Record<string, SpreadsheetHandle> = {},
): { openByIdCalls: string[] } => {
  const openByIdCalls: string[] = [];
  Object.assign(globalThis, {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => active.spreadsheet,
      openById: (id: string) => {
        openByIdCalls.push(id);
        const target = byId[id];
        if (!target) throw new Error(`mock spreadsheet not found: ${id}`);
        return target.spreadsheet;
      },
    },
  });
  return { openByIdCalls };
};

let logSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

const messagesOf = (spy: jest.SpyInstance): string[] =>
  spy.mock.calls.map((call) => String(call[0]));

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
});

afterAll(() => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
});

describe("migrateSheets 新規シート作成", () => {
  test("存在しないシートを作成しヘッダーを1行目A列から書き込む", () => {
    const env = makeSpreadsheet("active", []);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id", "name", "email"] }],
    });

    expect(env.insertedNames).toEqual(["User"]);
    expect(env.handleOf("User").snapshot()).toEqual([["id", "name", "email"]]);
    const logs = messagesOf(logSpy);
    expect(
      logs.some((log) => log.includes("created") && log.includes('"User"')),
    ).toBe(true);
  });

  test("複数モデルをまとめて作成できる", () => {
    const env = makeSpreadsheet("active", []);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [
        { name: "User", columns: ["id", "name"] },
        { name: "Post", columns: ["id", "authorId", "title"] },
      ],
    });

    expect(env.sheetNames()).toEqual(["User", "Post"]);
    expect(env.handleOf("Post").snapshot()).toEqual([
      ["id", "authorId", "title"],
    ]);
  });
});

describe("migrateSheets 既存シートへの列追加", () => {
  test("足りない列だけをヘッダー行の末尾へ追加する", () => {
    const users = makeSheet("User", [
      ["id", "name"],
      [1, "Alice"],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id", "name", "email", "age"] }],
    });

    expect(users.snapshot()).toEqual([
      ["id", "name", "email", "age"],
      [1, "Alice"],
    ]);
    expect(env.insertedNames).toEqual([]);
    const logs = messagesOf(logSpy);
    expect(
      logs.some(
        (log) =>
          log.includes("added") &&
          log.includes("email") &&
          log.includes("age") &&
          log.includes('"User"'),
      ),
    ).toBe(true);
  });

  test("既存の空シートには全列を1行目A列から書き込む", () => {
    const empty = makeSheet("User", []);
    const env = makeSpreadsheet("active", [empty]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "name"] }] });

    expect(empty.snapshot()).toEqual([["id", "name"]]);
    expect(env.insertedNames).toEqual([]);
  });

  test("列追加時もヘッダー行(1行目)以外には書き込まない", () => {
    const users = makeSheet("User", [["id"], [1], [2]]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "flag"] }] });

    expect(users.writes.length).toBeGreaterThan(0);
    users.writes.forEach((write) => {
      expect(write.row).toBe(1);
      expect(write.numRows).toBe(1);
    });
    expect(users.snapshot()).toEqual([["id", "flag"], [1], [2]]);
  });
});

describe("migrateSheets 冪等性", () => {
  test("2回実行しても2回目は書き込みが発生しない", () => {
    const users = makeSheet("User", [["id"], [1]]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);
    const models = [
      { name: "User", columns: ["id", "name"] },
      { name: "Post", columns: ["id", "title"] },
    ];

    migrateSheets({ models });
    const userSnapshot = users.snapshot();
    const postSnapshot = env.handleOf("Post").snapshot();
    const userWriteCount = users.writes.length;
    const postWriteCount = env.handleOf("Post").writes.length;
    const logCountAfterFirst = logSpy.mock.calls.length;

    migrateSheets({ models });

    expect(env.insertedNames).toEqual(["Post"]);
    expect(users.snapshot()).toEqual(userSnapshot);
    expect(env.handleOf("Post").snapshot()).toEqual(postSnapshot);
    expect(users.writes.length).toBe(userWriteCount);
    expect(env.handleOf("Post").writes.length).toBe(postWriteCount);
    const secondRunLogs = messagesOf(logSpy).slice(logCountAfterFirst);
    expect(secondRunLogs.some((log) => log.includes("up to date"))).toBe(true);
    expect(
      secondRunLogs.some(
        (log) => log.includes("created") || log.includes("added"),
      ),
    ).toBe(false);
  });
});

describe("migrateSheets 非破壊", () => {
  test("既存列の順序が schema と違っても並べ替えない", () => {
    const users = makeSheet("User", [
      ["name", "id"],
      ["Alice", 1],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "name"] }] });

    expect(users.snapshot()).toEqual([
      ["name", "id"],
      ["Alice", 1],
    ]);
    expect(users.writes).toEqual([]);
  });

  test("schema に無い列とシートは削除せず console.warn する", () => {
    const users = makeSheet("User", [
      ["id", "", "legacy"],
      [1, "", "x"],
    ]);
    const old = makeSheet("Old", [["a"]]);
    const env = makeSpreadsheet("active", [users, old]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(users.snapshot()).toEqual([
      ["id", "", "legacy"],
      [1, "", "x"],
    ]);
    expect(users.writes).toEqual([]);
    expect(env.sheetNames()).toEqual(["User", "Old"]);
    const warns = messagesOf(warnSpy);
    expect(
      warns.some(
        (warn) => warn.includes('"legacy"') && warn.includes('"User"'),
      ),
    ).toBe(true);
    expect(warns.some((warn) => warn.includes('"Old"'))).toBe(true);
    expect(warns.some((warn) => warn.includes('""'))).toBe(false);
  });
});

describe("migrateSheets 引数の検証", () => {
  test("models が無い場合は GassmaMissingArgumentError を投げる", () => {
    installSpreadsheetApp(makeSpreadsheet("active", []));
    const callUnsafely: (options: unknown) => void = migrateSheets;

    expect(() => callUnsafely(undefined)).toThrow(GassmaMissingArgumentError);
    expect(() => callUnsafely({})).toThrow(GassmaMissingArgumentError);
  });
});

describe("migrateSheets スプレッドシートの解決", () => {
  test("spreadsheetId 指定時は openById のスプレッドシートへ適用する", () => {
    const active = makeSpreadsheet("active", []);
    const target = makeSpreadsheet("target", []);
    const { openByIdCalls } = installSpreadsheetApp(active, {
      "target-id": target,
    });

    migrateSheets({
      spreadsheetId: "target-id",
      models: [{ name: "User", columns: ["id"] }],
    });

    expect(openByIdCalls).toEqual(["target-id"]);
    expect(target.insertedNames).toEqual(["User"]);
    expect(active.insertedNames).toEqual([]);
  });

  test("spreadsheetId 未指定時はアクティブなスプレッドシートへ適用する", () => {
    const active = makeSpreadsheet("active", []);
    installSpreadsheetApp(active);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(active.insertedNames).toEqual(["User"]);
  });
});
