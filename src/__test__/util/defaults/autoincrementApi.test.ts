import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import {
  GassmaAutoincrementInTransactionError,
  GassmaAutoincrementNotConfiguredError,
} from "../../../errors/autoincrement/autoincrementError";
import { GassmaClient } from "../../../gassma";
import type { GassmaController } from "../../../gassmaController";
import type { GassmaClientOptions } from "../../../types/relationTypes";
import {
  buildTxTestEnv,
  clearGasGlobals,
  makeLoggedSheet,
} from "../transaction/transactionTestClient";

const KEY = "gassma_autoincrement_ai-test_Users_id";

type Env = {
  users: GassmaController;
  posts: GassmaController;
  propsStore: Record<string, string>;
  waitLock: jest.Mock;
  releaseLock: jest.Mock;
};

const buildEnv = (
  userRows: unknown[][],
  options?: Partial<GassmaClientOptions>,
): Env => {
  const users = makeLoggedSheet("Users", userRows);
  const posts = makeLoggedSheet("Posts", [
    ["id", "title"],
    [1, "Post A"],
  ]);
  const sheets = [users.sheet, posts.sheet];
  const spreadsheet = {
    getId: () => "ai-test",
    getSheets: () => sheets,
    getSheetByName: (name: string) =>
      sheets.find((sheet: any) => sheet.getName() === name) ?? null,
  };
  const propsStore: Record<string, string> = {};
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => propsStore[key] ?? null,
        setProperty: (key: string, value: string) => {
          propsStore[key] = value;
        },
        deleteProperty: (key: string) => {
          delete propsStore[key];
        },
        getKeys: () => Object.keys(propsStore),
      }),
    },
  });
  let held = false;
  const waitLock = jest.fn(() => {
    held = true;
  });
  const releaseLock = jest.fn(() => {
    held = false;
  });
  const client: any = new GassmaClient({
    lock: { waitLock, releaseLock, hasLock: () => held },
    autoincrement: { Users: "id" },
    ...options,
  });
  return {
    users: client.Users,
    posts: client.Posts,
    propsStore,
    waitLock,
    releaseLock,
  };
};

const defaultRows: unknown[][] = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

afterEach(() => {
  clearGasGlobals();
});

describe("$getAutoincrement", () => {
  it("未設定なら次に発行される値は 1", () => {
    const env = buildEnv(defaultRows);
    expect(env.users.$getAutoincrement("id")).toBe(1);
  });

  it("create の後は次に発行される値が進む", () => {
    const env = buildEnv(defaultRows);
    env.users.create({ data: { name: "Carol", age: 40 } });
    expect(env.users.$getAutoincrement("id")).toBe(2);
  });

  it("ロックを取らない", () => {
    const env = buildEnv(defaultRows);
    env.users.$getAutoincrement("id");
    expect(env.waitLock).not.toHaveBeenCalled();
  });

  it("autoincrement 設定の無いフィールドは拒否する", () => {
    const env = buildEnv(defaultRows);
    expect(() => env.users.$getAutoincrement("name")).toThrow(
      GassmaAutoincrementNotConfiguredError,
    );
  });

  it("autoincrement 設定の無いシートは拒否する", () => {
    const env = buildEnv(defaultRows);
    expect(() => env.posts.$getAutoincrement("id")).toThrow(
      GassmaAutoincrementNotConfiguredError,
    );
  });
});

describe("$setAutoincrement", () => {
  it("次に発行される値を設定する", () => {
    const env = buildEnv(defaultRows);
    env.users.$setAutoincrement("id", 501);
    expect(env.propsStore[KEY]).toBe("500");
    expect(env.users.$getAutoincrement("id")).toBe(501);
  });

  it("設定した値が実際に次の create で採番される", () => {
    const env = buildEnv(defaultRows);
    env.users.$setAutoincrement("id", 501);
    const created: any = env.users.create({ data: { name: "Carol", age: 40 } });
    expect(created.id).toBe(501);
  });

  it("ロックを取得して解放する", () => {
    const env = buildEnv(defaultRows);
    env.users.$setAutoincrement("id", 501);
    expect(env.waitLock).toHaveBeenCalled();
    expect(env.releaseLock).toHaveBeenCalled();
  });

  it("不正な値は拒否しカウンターを書き換えない", () => {
    const env = buildEnv(defaultRows);
    expect(() => env.users.$setAutoincrement("id", 0)).toThrow(
      GassmaInvalidValueError,
    );
    expect(env.propsStore[KEY]).toBeUndefined();
  });
});

describe("$syncAutoincrement", () => {
  it("既存データの最大値 + 1 を次の値にして返す", () => {
    const env = buildEnv([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [500, "Bob", 30],
      [12, "Carol", 40],
    ]);
    expect(env.users.$syncAutoincrement("id")).toBe(501);
    expect(env.propsStore[KEY]).toBe("500");
  });

  it("同期した後の create が既存行と衝突しない", () => {
    const env = buildEnv([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [500, "Bob", 30],
    ]);
    env.users.$syncAutoincrement("id");
    const created: any = env.users.create({ data: { name: "Carol", age: 40 } });
    expect(created.id).toBe(501);
  });

  it("データが無ければ次の値は 1", () => {
    const env = buildEnv([["id", "name", "age"]]);
    expect(env.users.$syncAutoincrement("id")).toBe(1);
    expect(env.propsStore[KEY]).toBe("0");
  });

  it("空セルや非数値は無視する", () => {
    const env = buildEnv([
      ["id", "name", "age"],
      ["", "Alice", 20],
      ["x", "Bob", 30],
      [3, "Carol", 40],
    ]);
    expect(env.users.$syncAutoincrement("id")).toBe(4);
  });

  it("シート全体ではなく見出し行と対象列だけを読む", () => {
    const users = makeLoggedSheet("Users", defaultRows);
    const calls: number[][] = [];
    const rawSheet: any = users.sheet;
    const original = rawSheet.getRange;
    rawSheet.getRange = (
      row: number,
      col: number,
      numRows: number,
      numCols: number,
    ) => {
      calls.push([row, col, numRows, numCols]);
      return original(row, col, numRows, numCols);
    };
    const sheets = [users.sheet];
    Object.assign(globalThis, {
      SpreadsheetApp: {
        getActiveSpreadsheet: () => ({
          getId: () => "ai-test",
          getSheets: () => sheets,
          getSheetByName: (name: string) =>
            sheets.find((sheet: any) => sheet.getName() === name) ?? null,
        }),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: () => null,
          setProperty: () => undefined,
          getKeys: () => [],
        }),
      },
    });
    const client: any = new GassmaClient({
      autoincrement: { Users: "id" },
    });
    calls.splice(0);
    client.Users.$syncAutoincrement("id");
    expect(calls).toEqual([
      [1, 1, 1, 3],
      [2, 1, 2, 1],
    ]);
  });

  it("map のコード名で列を解決する", () => {
    const env = buildEnv(
      [
        ["identifier", "name", "age"],
        [7, "Alice", 20],
      ],
      { map: { Users: { id: "identifier" } } },
    );
    expect(env.users.$syncAutoincrement("id")).toBe(8);
  });

  it("ロックを取得して解放する", () => {
    const env = buildEnv(defaultRows);
    env.users.$syncAutoincrement("id");
    expect(env.waitLock).toHaveBeenCalled();
    expect(env.releaseLock).toHaveBeenCalled();
  });

  it("autoincrement 設定の無いフィールドは拒否する", () => {
    const env = buildEnv(defaultRows);
    expect(() => env.users.$syncAutoincrement("age")).toThrow(
      GassmaAutoincrementNotConfiguredError,
    );
  });
});

describe("$transaction 中の呼び出し", () => {
  it("tx クライアント経由の $setAutoincrement は拒否する", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    expect(() =>
      env.client.$transaction((tx: any) => tx.Users.$setAutoincrement("id", 5)),
    ).toThrow(GassmaAutoincrementInTransactionError);
  });

  it("外側のクライアント経由の $setAutoincrement も拒否する", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    const outer: any = env.client;
    expect(() =>
      env.client.$transaction(() => outer.Users.$setAutoincrement("id", 5)),
    ).toThrow(GassmaAutoincrementInTransactionError);
  });

  it("tx クライアント経由の $syncAutoincrement は拒否する", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    expect(() =>
      env.client.$transaction((tx: any) => tx.Users.$syncAutoincrement("id")),
    ).toThrow(GassmaAutoincrementInTransactionError);
  });

  it("外側のクライアント経由の $syncAutoincrement も拒否する", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    const outer: any = env.client;
    expect(() =>
      env.client.$transaction(() => outer.Users.$syncAutoincrement("id")),
    ).toThrow(GassmaAutoincrementInTransactionError);
  });

  it("$getAutoincrement は tx クライアント経由でも読める", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    const result = env.client.$transaction((tx: any) =>
      tx.Users.$getAutoincrement("id"),
    );
    expect(result).toBe(1);
  });

  it("トランザクション終了後は $setAutoincrement が再び使える", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    env.client.$transaction((tx: any) => tx.Users.findMany());
    const users: any = env.client;
    users.Users.$setAutoincrement("id", 10);
    expect(env.propsStore["gassma_autoincrement_tx-test_Users_id"]).toBe("9");
  });

  it("トランザクションが失敗した後も $setAutoincrement が使える", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    expect(() =>
      env.client.$transaction(() => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    const users: any = env.client;
    users.Users.$setAutoincrement("id", 10);
    expect(env.propsStore["gassma_autoincrement_tx-test_Users_id"]).toBe("9");
  });
});
