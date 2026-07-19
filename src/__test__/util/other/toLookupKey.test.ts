import { createCrossRealmDate } from "../../consts/crossRealm";
import { toLookupKey } from "../../../util/other/toLookupKey";

describe("toLookupKey", () => {
  test("should return the same key for Dates with the same time but different instances", () => {
    expect(toLookupKey(new Date("2026-07-18T09:30:00.000Z"))).toBe(
      toLookupKey(new Date("2026-07-18T09:30:00.000Z")),
    );
  });

  test("should return different keys for Dates with different times", () => {
    expect(toLookupKey(new Date("2026-07-18T09:30:00.000Z"))).not.toBe(
      toLookupKey(new Date("2026-07-18T09:30:00.001Z")),
    );
  });

  test("should not collide between a Date and any string", () => {
    const date = new Date("2026-07-18T09:30:00.000Z");
    const dateKey = toLookupKey(date);
    expect(dateKey).not.toBe(toLookupKey("2026-07-18T09:30:00.000Z"));
    expect(dateKey).not.toBe(toLookupKey(String(dateKey)));
  });

  test("should keep identity semantics for non-Date primitives", () => {
    expect(toLookupKey("a")).toBe(toLookupKey("a"));
    expect(toLookupKey(1)).toBe(1);
    expect(toLookupKey(true)).toBe(true);
    expect(toLookupKey(null)).toBe(null);
    expect(toLookupKey(1)).not.toBe(toLookupKey("1"));
  });
});

describe("toLookupKey with cross-realm Dates", () => {
  test("should return the same key for a cross-realm Date with the same time", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(crossDate instanceof Date).toBe(false);
    expect(toLookupKey(crossDate)).toBe(
      toLookupKey(new Date("2026-07-18T09:30:00.000Z")),
    );
  });

  test("should return different keys for cross-realm Dates with different times", () => {
    expect(
      toLookupKey(createCrossRealmDate("2026-07-18T09:30:00.000Z")),
    ).not.toBe(toLookupKey(createCrossRealmDate("2026-07-18T09:30:00.001Z")));
  });
});
