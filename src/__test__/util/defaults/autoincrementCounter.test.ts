import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import {
  GassmaAutoincrementInTransactionError,
  GassmaAutoincrementNotConfiguredError,
} from "../../../errors/autoincrement/autoincrementError";
import type { Lock } from "../../../types/relationTypes";
import type { AutoincrementTarget } from "../../../util/defaults/autoincrementCounter";
import {
  getAutoincrementCounter,
  setAutoincrementCounter,
  syncAutoincrementCounter,
} from "../../../util/defaults/autoincrementCounter";
import { setTransactionInProgress } from "../../../util/transaction/transactionState";

const KEY = "gassma_autoincrement_ss1_Users_id";

const mockWaitLock = jest.fn();
const mockReleaseLock = jest.fn();
const mockHasLock = jest.fn(() => false);
const lock: Lock = {
  waitLock: mockWaitLock,
  releaseLock: mockReleaseLock,
  hasLock: mockHasLock,
};

let store: Record<string, string> = {};

const targetOf = (
  override?: Partial<AutoincrementTarget>,
): AutoincrementTarget => ({
  modelName: "Users",
  field: "id",
  configuredFields: ["id"],
  keyBase: "ss1_Users",
  lock,
  ...override,
});

beforeEach(() => {
  store = {};
  mockWaitLock.mockReset();
  mockReleaseLock.mockReset();
  mockHasLock.mockReset();
  mockHasLock.mockReturnValue(false);
  (globalThis as Record<string, unknown>).PropertiesService = {
    getScriptProperties: () => ({
      getProperty: (key: string) => store[key] ?? null,
      setProperty: (key: string, value: string) => {
        store[key] = value;
      },
    }),
  };
});

afterEach(() => {
  setTransactionInProgress(false);
  delete (globalThis as Record<string, unknown>).PropertiesService;
});

describe("getAutoincrementCounter", () => {
  it("未設定なら次に発行される値は 1", () => {
    expect(getAutoincrementCounter(targetOf())).toBe(1);
  });

  it("最後に発行した値 + 1 を返す", () => {
    store[KEY] = "12";
    expect(getAutoincrementCounter(targetOf())).toBe(13);
  });

  it("読み取りだけなのでロックを取らない", () => {
    store[KEY] = "12";
    getAutoincrementCounter(targetOf());
    expect(mockWaitLock).not.toHaveBeenCalled();
    expect(mockReleaseLock).not.toHaveBeenCalled();
  });

  it("トランザクション中でも読める", () => {
    store[KEY] = "4";
    setTransactionInProgress(true);
    expect(getAutoincrementCounter(targetOf())).toBe(5);
  });

  it("autoincrement 未設定のフィールドは拒否する", () => {
    expect(() => getAutoincrementCounter(targetOf({ field: "name" }))).toThrow(
      GassmaAutoincrementNotConfiguredError,
    );
  });
});

describe("setAutoincrementCounter", () => {
  it("次に発行される値として保存する(内部は -1)", () => {
    setAutoincrementCounter(targetOf(), 501);
    expect(store[KEY]).toBe("500");
    expect(getAutoincrementCounter(targetOf())).toBe(501);
  });

  it("1 を指定できる", () => {
    setAutoincrementCounter(targetOf(), 1);
    expect(store[KEY]).toBe("0");
  });

  it("ロックを取得して解放する", () => {
    setAutoincrementCounter(targetOf(), 10);
    expect(mockWaitLock).toHaveBeenCalledWith(10000);
    expect(mockReleaseLock).toHaveBeenCalled();
  });

  it("lock が無ければロック無しで実行する", () => {
    setAutoincrementCounter(targetOf({ lock: null }), 10);
    expect(store[KEY]).toBe("9");
    expect(mockWaitLock).not.toHaveBeenCalled();
  });

  it("autoincrement 未設定のフィールドは拒否する", () => {
    expect(() =>
      setAutoincrementCounter(targetOf({ field: "name" }), 10),
    ).toThrow(GassmaAutoincrementNotConfiguredError);
    expect(store).toEqual({});
  });

  it("トランザクション中は拒否する", () => {
    setTransactionInProgress(true);
    expect(() => setAutoincrementCounter(targetOf(), 10)).toThrow(
      GassmaAutoincrementInTransactionError,
    );
    expect(store).toEqual({});
  });

  const invalidValues: [string, unknown][] = [
    ["0", 0],
    ["負数", -1],
    ["小数", 1.5],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
    ["文字列", "5"],
    ["null", null],
    ["undefined", undefined],
    ["boolean", true],
  ];

  invalidValues.forEach(([label, value]) => {
    it(`不正な値(${label})は拒否する`, () => {
      expect(() => setAutoincrementCounter(targetOf(), value as any)).toThrow(
        GassmaInvalidValueError,
      );
      expect(store).toEqual({});
    });
  });
});

describe("syncAutoincrementCounter", () => {
  it("既存の最大値 + 1 を次の値にして返す", () => {
    expect(syncAutoincrementCounter(targetOf(), () => [1, 500, 12])).toBe(501);
    expect(store[KEY]).toBe("500");
  });

  it("空セルや非数値は無視する", () => {
    const values = [1, "", null, "999", new Date(), true, 7];
    expect(syncAutoincrementCounter(targetOf(), () => values)).toBe(8);
    expect(store[KEY]).toBe("7");
  });

  it("数値が1つも無ければ次の値は 1", () => {
    expect(syncAutoincrementCounter(targetOf(), () => ["a", "", null])).toBe(1);
    expect(store[KEY]).toBe("0");
  });

  it("行が無ければ次の値は 1", () => {
    expect(syncAutoincrementCounter(targetOf(), () => [])).toBe(1);
    expect(store[KEY]).toBe("0");
  });

  it("負数しか無ければ次の値は 1", () => {
    expect(syncAutoincrementCounter(targetOf(), () => [-5, -1])).toBe(1);
    expect(store[KEY]).toBe("0");
  });

  it("小数は切り捨てた値を最大値として扱う", () => {
    expect(syncAutoincrementCounter(targetOf(), () => [3.7])).toBe(4);
    expect(store[KEY]).toBe("3");
  });

  it("既存のカウンターより小さくても既存データに合わせる", () => {
    store[KEY] = "1000";
    expect(syncAutoincrementCounter(targetOf(), () => [3])).toBe(4);
    expect(store[KEY]).toBe("3");
  });

  it("ロックを取得して解放する", () => {
    syncAutoincrementCounter(targetOf(), () => [3]);
    expect(mockWaitLock).toHaveBeenCalledWith(10000);
    expect(mockReleaseLock).toHaveBeenCalled();
  });

  it("列の読み込みはロックの内側で行う", () => {
    const order: string[] = [];
    mockWaitLock.mockImplementation(() => order.push("waitLock"));
    mockReleaseLock.mockImplementation(() => order.push("releaseLock"));
    syncAutoincrementCounter(targetOf(), () => {
      order.push("read");
      return [3];
    });
    expect(order).toEqual(["waitLock", "read", "releaseLock"]);
  });

  it("autoincrement 未設定のフィールドは拒否する", () => {
    expect(() =>
      syncAutoincrementCounter(targetOf({ field: "name" }), () => [3]),
    ).toThrow(GassmaAutoincrementNotConfiguredError);
    expect(store).toEqual({});
  });

  it("トランザクション中は拒否する", () => {
    setTransactionInProgress(true);
    expect(() => syncAutoincrementCounter(targetOf(), () => [3])).toThrow(
      GassmaAutoincrementInTransactionError,
    );
    expect(store).toEqual({});
  });

  it("列が見つからなければ拒否する", () => {
    expect(() => syncAutoincrementCounter(targetOf(), () => null)).toThrow(
      GassmaInvalidValueError,
    );
    expect(store).toEqual({});
  });
});

describe("GassmaAutoincrementNotConfiguredError", () => {
  it("シート名・フィールド名・設定済みフィールドを含む", () => {
    const error = new GassmaAutoincrementNotConfiguredError("Users", "name", [
      "id",
      "seq",
    ]);
    expect(error.message).toContain("Users");
    expect(error.message).toContain("name");
    expect(error.message).toContain("id, seq");
  });

  it("設定が1つも無い場合もシート名とフィールド名が分かる", () => {
    const error = new GassmaAutoincrementNotConfiguredError("Posts", "id", []);
    expect(error.message).toContain("Posts");
    expect(error.message).toContain("id");
  });
});

describe("GassmaAutoincrementInTransactionError", () => {
  it("呼ばれたメソッド名を含む", () => {
    const error = new GassmaAutoincrementInTransactionError(
      "$setAutoincrement",
    );
    expect(error.message).toContain("$setAutoincrement");
    expect(error.message).toContain("$transaction");
  });
});
