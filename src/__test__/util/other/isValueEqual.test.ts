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
