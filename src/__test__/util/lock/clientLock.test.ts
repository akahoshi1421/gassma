import { GassmaInvalidLockError } from "../../../errors/lock/lockError";
import { GassmaTransactionLockRequiredError } from "../../../errors/transaction/transactionError";
import { GassmaClient } from "../../../gassma";
import type { GassmaClientOptions } from "../../../types/relationTypes";
import { createCrossRealmValue } from "../../consts/crossRealm";
import { sheetOf } from "../extends/extendsTestClient";
import { makeLoggedSheet } from "../transaction/transactionTestClient";

const COUNTER_KEY = "gassma_autoincrement_lock-test_Users_id";

const setupSpreadsheet = () => {
  const users = makeLoggedSheet("Users", [
    ["id", "name", "age"],
    [1, "Alice", 20],
  ]);
  const sheets = [users.sheet];
  const spreadsheet = {
    getId: () => "lock-test",
    getSheets: () => sheets,
    getSheetByName: (name: string) =>
      sheets.find((sheet) => sheet.getName() === name) ?? null,
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
  return { users, propsStore };
};

const makeLockMock = () => {
  let held = false;
  return {
    waitLock: jest.fn((_timeoutInMillis: number) => {
      held = true;
    }),
    tryLock: jest.fn((_timeoutInMillis: number) => {
      held = true;
      return true;
    }),
    releaseLock: jest.fn(() => {
      held = false;
    }),
    hasLock: jest.fn(() => held),
  };
};

const optionsWithLock = (lock: any): GassmaClientOptions => ({ lock });

const created = (value: unknown): any => value;

afterEach(() => {
  Object.assign(globalThis, {
    SpreadsheetApp: undefined,
    PropertiesService: undefined,
  });
});

describe("GassmaClient の lock オプション検証", () => {
  test("lock を渡さなければ構築できる", () => {
    setupSpreadsheet();
    expect(() => new GassmaClient()).not.toThrow();
    expect(() => new GassmaClient({})).not.toThrow();
    expect(() => new GassmaClient(optionsWithLock(undefined))).not.toThrow();
  });

  test("lock: null は GassmaInvalidLockError", () => {
    setupSpreadsheet();
    expect(() => new GassmaClient(optionsWithLock(null))).toThrow(
      GassmaInvalidLockError,
    );
    expect(() => new GassmaClient(optionsWithLock(null))).toThrow(
      "LockService.getDocumentLock() returns null in a standalone script or a web app",
    );
  });

  test("waitLock を持たない値は GassmaInvalidLockError", () => {
    setupSpreadsheet();
    expect(() => new GassmaClient(optionsWithLock({}))).toThrow(
      GassmaInvalidLockError,
    );
    expect(() => new GassmaClient(optionsWithLock("lock"))).toThrow(
      GassmaInvalidLockError,
    );
    expect(
      () => new GassmaClient(optionsWithLock({ waitLock: "not a function" })),
    ).toThrow(GassmaInvalidLockError);
  });

  test("別 realm の Lock でも受け入れる", () => {
    setupSpreadsheet();
    const lock = createCrossRealmValue<GoogleAppsScript.Lock.Lock>(
      "{ waitLock: () => {}, releaseLock: () => {}, hasLock: () => false, tryLock: () => true }",
    );
    expect(() => new GassmaClient({ lock })).not.toThrow();
  });
});

describe("autoincrement の lock", () => {
  test("lock があれば採番の前後で取得・解放する", () => {
    const env = setupSpreadsheet();
    env.propsStore[COUNTER_KEY] = "1";
    const lock = makeLockMock();
    const client = new GassmaClient({ lock, autoincrement: { Users: "id" } });

    const result = sheetOf(client, "Users").create({
      data: { name: "Carol", age: 40 },
    });

    expect(created(result).id).toBe(2);
    expect(lock.waitLock).toHaveBeenCalledWith(10000);
    expect(lock.releaseLock).toHaveBeenCalledTimes(1);
    expect(env.propsStore[COUNTER_KEY]).toBe("2");
  });

  test("lock が無ければロックを取らずに採番する", () => {
    const env = setupSpreadsheet();
    env.propsStore[COUNTER_KEY] = "1";
    const client = new GassmaClient({ autoincrement: { Users: "id" } });

    const result = sheetOf(client, "Users").create({
      data: { name: "Carol", age: 40 },
    });

    expect(created(result).id).toBe(2);
    expect(env.propsStore[COUNTER_KEY]).toBe("2");
  });

  test("createMany でも lock を1回だけ取得する", () => {
    const env = setupSpreadsheet();
    env.propsStore[COUNTER_KEY] = "1";
    const lock = makeLockMock();
    const client = new GassmaClient({ lock, autoincrement: { Users: "id" } });

    sheetOf(client, "Users").createMany({
      data: [
        { name: "Carol", age: 40 },
        { name: "Dave", age: 50 },
      ],
    });

    expect(lock.waitLock).toHaveBeenCalledTimes(1);
    expect(lock.releaseLock).toHaveBeenCalledTimes(1);
    expect(env.propsStore[COUNTER_KEY]).toBe("3");
  });

  test("既にそのロックを保持していれば取得も解放もしない", () => {
    setupSpreadsheet();
    const lock = makeLockMock();
    const client = new GassmaClient({ lock, autoincrement: { Users: "id" } });
    lock.waitLock(1000);
    lock.waitLock.mockClear();

    sheetOf(client, "Users").create({ data: { name: "Carol", age: 40 } });

    expect(lock.waitLock).not.toHaveBeenCalled();
    expect(lock.releaseLock).not.toHaveBeenCalled();
  });
});

describe("$transaction の lock 必須", () => {
  test("lock 無しのクライアントは GassmaTransactionLockRequiredError", () => {
    setupSpreadsheet();
    const client = new GassmaClient();

    expect(() => client.$transaction(() => 1)).toThrow(
      GassmaTransactionLockRequiredError,
    );
    expect(() => client.$transaction(() => 1)).toThrow(
      "$transaction requires a lock.",
    );
  });

  test("fn は呼ばれない", () => {
    setupSpreadsheet();
    const client = new GassmaClient();
    const fn = jest.fn();

    expect(() => client.$transaction(fn)).toThrow(
      GassmaTransactionLockRequiredError,
    );
    expect(fn).not.toHaveBeenCalled();
  });
});
