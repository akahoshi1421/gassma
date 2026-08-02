import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";
import {
  containsValue,
  isValueEqual,
  resetMembershipCache,
} from "../../../util/other/isValueEqual";

describe("isValueEqual", () => {
  test("should return true for Dates with the same time but different instances", () => {
    expect(
      isValueEqual(
        new Date("2026-07-18T09:30:00.000Z"),
        new Date("2026-07-18T09:30:00.000Z"),
      ),
    ).toBe(true);
  });

  test("should return false for Dates with different times", () => {
    expect(
      isValueEqual(
        new Date("2026-07-18T09:30:00.000Z"),
        new Date("2026-07-18T09:30:00.001Z"),
      ),
    ).toBe(false);
  });

  test("should return false for Date vs ISO string in both directions", () => {
    const date = new Date("2026-07-18T09:30:00.000Z");
    expect(isValueEqual(date, "2026-07-18T09:30:00.000Z")).toBe(false);
    expect(isValueEqual("2026-07-18T09:30:00.000Z", date)).toBe(false);
  });

  test("should return false for Date vs null", () => {
    expect(isValueEqual(new Date("2026-07-18T09:30:00.000Z"), null)).toBe(
      false,
    );
    expect(isValueEqual(null, new Date("2026-07-18T09:30:00.000Z"))).toBe(
      false,
    );
  });

  test("should keep strict equality for non-Date values", () => {
    expect(isValueEqual("test", "test")).toBe(true);
    expect(isValueEqual(42, 42)).toBe(true);
    expect(isValueEqual(true, true)).toBe(true);
    expect(isValueEqual(null, null)).toBe(true);
    expect(isValueEqual(42, "42")).toBe(false);
    expect(isValueEqual(Number.NaN, Number.NaN)).toBe(false);
  });
});

describe("isValueEqual with cross-realm Dates", () => {
  test("should return true for same time across realms in both directions", () => {
    const localDate = new Date("2026-07-18T09:30:00.000Z");
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(crossDate instanceof Date).toBe(false);
    expect(isValueEqual(localDate, crossDate)).toBe(true);
    expect(isValueEqual(crossDate, localDate)).toBe(true);
  });

  test("should return true for two cross-realm Dates with the same time", () => {
    expect(
      isValueEqual(
        createCrossRealmDate("2026-07-18T09:30:00.000Z"),
        createCrossRealmDate("2026-07-18T09:30:00.000Z"),
      ),
    ).toBe(true);
  });

  test("should return false for different times across realms", () => {
    expect(
      isValueEqual(
        new Date("2026-07-18T09:30:00.000Z"),
        createCrossRealmDate("2026-07-18T09:30:00.001Z"),
      ),
    ).toBe(false);
  });

  test("should return false for a cross-realm Date vs an ISO string", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(isValueEqual(crossDate, "2026-07-18T09:30:00.000Z")).toBe(false);
    expect(isValueEqual("2026-07-18T09:30:00.000Z", crossDate)).toBe(false);
  });
});

describe("containsValue", () => {
  test("should find a Date with the same time but different instance", () => {
    const list = [new Date("2026-07-18T09:30:00.000Z")];
    expect(containsValue(list, new Date("2026-07-18T09:30:00.000Z"))).toBe(
      true,
    );
  });

  test("should not find a Date when no time matches", () => {
    const list = [new Date("2026-07-18T09:30:00.000Z")];
    expect(containsValue(list, new Date("2026-07-18T10:00:00.000Z"))).toBe(
      false,
    );
  });

  test("should not match a Date against ISO strings", () => {
    expect(
      containsValue(
        ["2026-07-18T09:30:00.000Z"],
        new Date("2026-07-18T09:30:00.000Z"),
      ),
    ).toBe(false);
  });

  test("should keep SameValueZero for non-Date values", () => {
    expect(containsValue(["a", "b"], "a")).toBe(true);
    expect(containsValue([1, 2], 3)).toBe(false);
    expect(containsValue([Number.NaN], Number.NaN)).toBe(true);
  });
});

describe("containsValue の旧実装との同値性(境界値総当たり)", () => {
  const oldContainsValue = (
    list: readonly unknown[],
    value: unknown,
  ): boolean =>
    list.includes(value) || list.some((item) => isValueEqual(item, value));

  const d1a = new Date("2026-01-01T00:00:00.000Z");
  const d1b = new Date("2026-01-01T00:00:00.000Z");
  const d2 = new Date("2026-01-02T00:00:00.000Z");
  const invalid1 = new Date("invalid");
  const invalid2 = new Date("invalid");
  const crossD1 = createCrossRealmDate("2026-01-01T00:00:00.000Z");
  const obj = { key: "value" };
  const boundaryValues: readonly unknown[] = [
    Number.NaN,
    0,
    -0,
    null,
    undefined,
    "",
    "0",
    "1",
    1,
    true,
    false,
    "2026-01-01T00:00:00.000Z",
    d1a,
    d1b,
    d2,
    invalid1,
    invalid2,
    `date:${d1a.getTime()}`,
    "str:1",
    obj,
    crossD1,
  ];

  test("1要素リスト×全境界値の総当たりで旧実装と一致する", () => {
    boundaryValues.forEach((listValue) => {
      boundaryValues.forEach((probe) => {
        expect(containsValue([listValue], probe)).toBe(
          oldContainsValue([listValue], probe),
        );
      });
    });
  });

  test("全境界値リストに対する判定が旧実装と一致する", () => {
    boundaryValues.forEach((probe) => {
      expect(containsValue(boundaryValues, probe)).toBe(
        oldContainsValue(boundaryValues, probe),
      );
    });
  });

  test("空配列では常に false", () => {
    boundaryValues.forEach((probe) => {
      expect(containsValue([], probe)).toBe(false);
    });
  });

  test("巨大配列でも旧実装と一致する", () => {
    const bigList: unknown[] = [];
    for (let i = 0; i < 5000; i++) {
      bigList.push(`key${i}`, i, new Date(1700000000000 + i));
    }
    const probes = [
      "key4999",
      "missing",
      4999,
      5000,
      new Date(1700000004999),
      new Date(1700000005000),
      Number.NaN,
      null,
    ];
    probes.forEach((probe) => {
      expect(containsValue(bigList, probe)).toBe(
        oldContainsValue(bigList, probe),
      );
    });
  });
});

describe("containsValue は同一配列のミューテーション後も正しい", () => {
  test("push で追加した値を見つけられる(by.ts の重複除去パターン)", () => {
    const list: unknown[] = [];
    expect(containsValue(list, "a")).toBe(false);
    list.push("a");
    expect(containsValue(list, "a")).toBe(true);
    expect(containsValue(list, "b")).toBe(false);
    list.push("b");
    expect(containsValue(list, "b")).toBe(true);
  });

  test("splice で削除した値は見つからない", () => {
    const list: unknown[] = ["a", "b"];
    expect(containsValue(list, "a")).toBe(true);
    list.splice(0, 1);
    expect(containsValue(list, "a")).toBe(false);
    expect(containsValue(list, "b")).toBe(true);
  });

  test("push した Date も時刻一致で見つけられる", () => {
    const list: unknown[] = [new Date("2026-01-01T00:00:00.000Z")];
    expect(containsValue(list, new Date("2026-01-02T00:00:00.000Z"))).toBe(
      false,
    );
    list.push(new Date("2026-01-02T00:00:00.000Z"));
    expect(containsValue(list, new Date("2026-01-02T00:00:00.000Z"))).toBe(
      true,
    );
  });
});

describe("resetMembershipCache", () => {
  test("リセット後は同 length の in-place 変更が反映される", () => {
    const list: unknown[] = [1, 2, 3];
    expect(containsValue(list, 1)).toBe(true);
    list[0] = 99;
    resetMembershipCache();
    expect(containsValue(list, 99)).toBe(true);
    expect(containsValue(list, 1)).toBe(false);
  });

  test("リセット後は同 length で入れ替えた Date も時刻一致で判定される", () => {
    const list: unknown[] = [new Date("2026-01-01T00:00:00.000Z")];
    expect(containsValue(list, new Date("2026-01-01T00:00:00.000Z"))).toBe(
      true,
    );
    list[0] = new Date("2026-02-01T00:00:00.000Z");
    resetMembershipCache();
    expect(containsValue(list, new Date("2026-02-01T00:00:00.000Z"))).toBe(
      true,
    );
    expect(containsValue(list, new Date("2026-01-01T00:00:00.000Z"))).toBe(
      false,
    );
  });
});

describe("containsValue with cross-realm Dates", () => {
  test("should find a cross-realm Date in a same-realm list", () => {
    const list = [new Date("2026-07-18T09:30:00.000Z")];
    expect(
      containsValue(list, createCrossRealmDate("2026-07-18T09:30:00.000Z")),
    ).toBe(true);
  });

  test("should find a same-realm Date in a cross-realm list", () => {
    const crossList = createCrossRealmValue<readonly unknown[]>(
      '[new Date("2026-07-18T09:30:00.000Z")]',
    );
    expect(containsValue(crossList, new Date("2026-07-18T09:30:00.000Z"))).toBe(
      true,
    );
  });

  test("should not find a cross-realm Date when no time matches", () => {
    const list = [new Date("2026-07-18T09:30:00.000Z")];
    expect(
      containsValue(list, createCrossRealmDate("2026-07-18T10:00:00.000Z")),
    ).toBe(false);
  });
});
