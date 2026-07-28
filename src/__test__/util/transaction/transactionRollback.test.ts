import { GassmaTransactionRollbackError } from "../../../errors/transaction/transactionError";
import { buildBackupName } from "../../../util/transaction/transactionBackup";
import { buildTxTestEnv, clearGasGlobals } from "./transactionTestClient";

const MARKER_KEY = "gassma_tx_backup_tx-test";

const initialUsers = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

afterEach(() => {
  clearGasGlobals();
  jest.restoreAllMocks();
});

describe("backup ライフサイクル", () => {
  test("成功時に backup が作成→削除されマーカーも消える", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
    });

    expect(env.users.copyToCallCount()).toBe(1);
    expect(env.posts.copyToCallCount()).toBe(0);
    expect(env.sheetNames()).toEqual(["Users", "Posts"]);
    expect(
      env.propsLog
        .filter((call) => call.key === MARKER_KEY)
        .map((call) => call.method),
    ).toEqual(["setProperty", "deleteProperty"]);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
    expect(env.users.snapshot()).toHaveLength(4);
  });

  test("マーカーには backup 名一覧の JSON が入る", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
    });

    const setCall = env.propsLog.find(
      (call) => call.method === "setProperty" && call.key === MARKER_KEY,
    );
    const names = JSON.parse(setCall?.value ?? "[]");
    expect(names).toHaveLength(1);
    expect(names[0]).toMatch(/^_gassma_tx_\d+_Users$/);
  });

  test("rollback: false では copyTo もマーカーも一切ない", () => {
    const env = buildTxTestEnv();

    env.client.$transaction(
      (tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      },
      { rollback: false },
    );

    expect(env.users.copyToCallCount()).toBe(0);
    expect(env.propsLog).toEqual([]);
    expect(env.users.snapshot()).toHaveLength(4);
  });

  test("読み取りのみの tx では backup を作らない", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => tx.Users.count({}));

    expect(env.users.copyToCallCount()).toBe(0);
    expect(env.propsLog).toEqual([]);
  });

  test("fn throw では backup を作らず無書き込みのまま", () => {
    const env = buildTxTestEnv();

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(env.users.copyToCallCount()).toBe(0);
    expect(env.propsLog).toEqual([]);
    expect(env.users.snapshot()).toEqual(initialUsers);
  });
});

describe("mid-flush 失敗からの復元", () => {
  test("値と数式が tx 前と完全一致に戻り元エラーが rethrow される", () => {
    const env = buildTxTestEnv({
      usersConfig: {
        formulas: [
          ["", "", ""],
          ["", "", ""],
          ["", "", "=A2*15"],
        ],
        failOnWriteCall: 2,
      },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
        tx.Users.update({ where: { id: 1 }, data: { age: 21 } });
      }),
    ).toThrow("mock write failure at call 2");

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.users.formulaSnapshot()).toEqual([
      ["", "", ""],
      ["", "", ""],
      ["", "", "=A2*15"],
    ]);
    expect(env.sheetNames()).toEqual(["Users", "Posts"]);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("append 済みで死んでも行数が戻る", () => {
    const env = buildTxTestEnv({
      usersConfig: { failOnWriteCall: 2 },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
        tx.Users.create({ data: { id: 4, name: "Dave", age: 50 } });
      }),
    ).toThrow("mock write failure at call 2");

    expect(env.users.snapshot()).toHaveLength(3);
    expect(env.users.snapshot()).toEqual(initialUsers);
  });

  test("複数シートに書いていた場合は全シートが復元される", () => {
    const env = buildTxTestEnv({
      postsConfig: { failOnWriteCall: 1 },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
        tx.Posts.create({ data: { id: 103, authorId: 3, title: "C" } });
      }),
    ).toThrow("mock write failure at call 1");

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual([
      ["id", "authorId", "title"],
      [101, 1, "Post A"],
      [102, 2, "Post B"],
    ]);
    expect(env.sheetNames()).toEqual(["Users", "Posts"]);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
  });

  test("updateMany の一括 setValues が失敗しても全行が復元される", () => {
    const env = buildTxTestEnv({
      usersConfig: { failOnWriteCall: 1 },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.updateMany({ data: { age: { increment: 1 } } });
      }),
    ).toThrow("mock write failure at call 1");

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.sheetNames()).toEqual(["Users", "Posts"]);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
  });

  test("deleteMany の一括 deleteRows が失敗しても行数が戻る", () => {
    const env = buildTxTestEnv({
      usersConfig: { failOnWriteCall: 1 },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.deleteMany({});
      }),
    ).toThrow("mock write failure at call 1");

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
  });

  test("エラー後は再び $transaction を開始できる", () => {
    const env = buildTxTestEnv({
      usersConfig: { failOnWriteCall: 1 },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      }),
    ).toThrow("mock write failure at call 1");

    const result = env.client.$transaction((tx) => tx.Users.count({}));
    expect(result).toBe(2);
  });
});

describe("復元も失敗した場合", () => {
  test("backup を温存し backup 名入りの GassmaTransactionRollbackError", () => {
    const env = buildTxTestEnv({
      usersConfig: { failOnWriteCall: 1, failOnClearContents: true },
    });

    let thrown: unknown = null;
    try {
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(GassmaTransactionRollbackError);
    const error =
      thrown instanceof GassmaTransactionRollbackError ? thrown : null;
    expect(error?.backupSheetNames).toHaveLength(1);
    const backupName = error?.backupSheetNames[0] ?? "";
    expect(backupName).toMatch(/^_gassma_tx_\d+_Users$/);
    expect(String(error?.message)).toContain(backupName);
    expect(env.sheetNames()).toContain(backupName);
    const backupSheet: any = env.spreadsheet.getSheetByName(backupName);
    expect(backupSheet.isSheetHidden()).toBe(true);
    expect(env.propsStore[MARKER_KEY]).toBe(JSON.stringify([backupName]));
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });
});

describe("backup 作成中の失敗", () => {
  test("copyTo 失敗時は作成済み backup を破棄しエラーを rethrow・無書き込み", () => {
    const env = buildTxTestEnv({
      postsConfig: { failOnCopyTo: true },
    });

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
        tx.Posts.create({ data: { id: 103, authorId: 3, title: "C" } });
      }),
    ).toThrow("mock copyTo failure");

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.sheetNames()).toEqual(["Users", "Posts"]);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
    expect(
      env.propsLog.filter((call) => call.method === "setProperty"),
    ).toEqual([]);
  });
});

describe("stale マーカー検出", () => {
  test("残存マーカーがあると警告して続行しマーカーは上書き後に消える", () => {
    const env = buildTxTestEnv();
    env.propsStore[MARKER_KEY] = JSON.stringify(["_gassma_tx_1_Users"]);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    env.client.$transaction((tx) => {
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain(MARKER_KEY);
    expect(env.users.snapshot()).toHaveLength(4);
    expect(
      env.propsLog
        .filter((call) => call.key === MARKER_KEY)
        .map((call) => call.method),
    ).toEqual(["setProperty", "deleteProperty"]);
    expect(env.propsStore[MARKER_KEY]).toBeUndefined();
  });

  test("マーカーがなければ警告しない", () => {
    const env = buildTxTestEnv();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    env.client.$transaction((tx) => tx.Users.count({}));

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("buildBackupName", () => {
  test("短い名前は _gassma_tx_<ts>_<name> のまま", () => {
    expect(buildBackupName(123, "Users", 0)).toBe("_gassma_tx_123_Users");
  });

  test("100 文字を超える場合は切り詰めて index で一意化", () => {
    const longName = "x".repeat(120);
    const name = buildBackupName(1721990000000, longName, 3);
    expect(name.length).toBeLessThanOrEqual(100);
    expect(name.startsWith("_gassma_tx_1721990000000_")).toBe(true);
    expect(name.endsWith("_3")).toBe(true);
  });
});
