import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";
import { isDateValue } from "../../../util/other/isDateValue";

describe("isDateValue", () => {
  test("should return true for a same-realm Date", () => {
    expect(isDateValue(new Date("2026-07-18T09:30:00.000Z"))).toBe(true);
  });

  test("should return true for a cross-realm Date", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(crossDate instanceof Date).toBe(false);
    expect(isDateValue(crossDate)).toBe(true);
  });

  test("should return false for null and undefined", () => {
    expect(isDateValue(null)).toBe(false);
    expect(isDateValue(undefined)).toBe(false);
  });

  test("should return false for an ISO string", () => {
    expect(isDateValue("2026-07-18T09:30:00.000Z")).toBe(false);
  });

  test("should return false for a number", () => {
    expect(isDateValue(1784367000000)).toBe(false);
  });

  test("should return false for a plain object and an array", () => {
    expect(isDateValue({ equals: new Date() })).toBe(false);
    expect(isDateValue([new Date()])).toBe(false);
  });

  test("should return false for a cross-realm plain object", () => {
    const crossObject = createCrossRealmValue<Record<string, unknown>>(
      '{ equals: new Date("2026-07-18T09:30:00.000Z") }',
    );
    expect(isDateValue(crossObject)).toBe(false);
  });
});
