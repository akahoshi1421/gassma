import { isMissingValue } from "../../../util/other/isMissingValue";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";

describe("isMissingValue", () => {
  test("should return true for null and undefined", () => {
    expect(isMissingValue(null)).toBe(true);
    expect(isMissingValue(undefined)).toBe(true);
  });

  test("should return true for NaN and an Invalid Date", () => {
    expect(isMissingValue(Number.NaN)).toBe(true);
    expect(isMissingValue(new Date("nope"))).toBe(true);
  });

  test("should return false for a valid Date", () => {
    expect(isMissingValue(new Date("2026-07-18T09:30:00.000Z"))).toBe(false);
  });

  test("should return false for falsy scalars", () => {
    expect(isMissingValue(0)).toBe(false);
    expect(isMissingValue("")).toBe(false);
    expect(isMissingValue(false)).toBe(false);
  });
});

describe("isMissingValue with cross-realm values", () => {
  test("should return false for a cross-realm valid Date", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(crossDate instanceof Date).toBe(false);
    expect(isMissingValue(crossDate)).toBe(false);
  });

  test("should return true for a cross-realm Invalid Date", () => {
    const crossInvalid = createCrossRealmValue<Date>('new Date("nope")');
    expect(isMissingValue(crossInvalid)).toBe(true);
  });

  test("should return false for a cross-realm array and plain object", () => {
    expect(isMissingValue(createCrossRealmValue<unknown[]>("[1]"))).toBe(false);
    expect(
      isMissingValue(
        createCrossRealmValue<Record<string, unknown>>('{ key: "value" }'),
      ),
    ).toBe(false);
  });
});
