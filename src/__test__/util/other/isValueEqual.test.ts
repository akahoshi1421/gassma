import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";
import { containsValue, isValueEqual } from "../../../util/other/isValueEqual";

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
