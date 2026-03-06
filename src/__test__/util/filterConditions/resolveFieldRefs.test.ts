import type { FilterConditions } from "../../../types/coreTypes";
import { FieldRef } from "../../../util/filterConditions/fieldRef";
import { resolveFieldRefs } from "../../../util/filterConditions/resolveFieldRefs";

// FieldRef を含む FilterConditions をテスト用にキャスト
const fc = (obj: Record<string, unknown>) => obj as FilterConditions;

describe("resolveFieldRefs", () => {
  const titles = ["firstName", "lastName", "age", "score"];

  test("should resolve FieldRef in equals to actual row value", () => {
    const row = ["Alice", "Bob", 30, 90];
    const ref = new FieldRef("User", "lastName");
    const result = resolveFieldRefs(fc({ equals: ref }), row, titles);
    expect(result).toEqual({ equals: "Bob" });
  });

  test("should leave plain values unchanged", () => {
    const row = ["Alice", "Bob", 30, 90];
    const result = resolveFieldRefs({ equals: "test" }, row, titles);
    expect(result).toEqual({ equals: "test" });
  });

  test("should resolve FieldRef in lt/lte/gt/gte", () => {
    const row = ["Alice", "Bob", 30, 90];
    const ref = new FieldRef("User", "score");
    expect(resolveFieldRefs(fc({ lt: ref }), row, titles)).toEqual({ lt: 90 });
    expect(resolveFieldRefs(fc({ lte: ref }), row, titles)).toEqual({
      lte: 90,
    });
    expect(resolveFieldRefs(fc({ gt: ref }), row, titles)).toEqual({ gt: 90 });
    expect(resolveFieldRefs(fc({ gte: ref }), row, titles)).toEqual({
      gte: 90,
    });
  });

  test("should resolve FieldRef in contains to string", () => {
    const row = ["Alice", 42, 30, 90];
    const ref = new FieldRef("User", "lastName");
    const result = resolveFieldRefs(fc({ contains: ref }), row, titles);
    expect(result).toEqual({ contains: "42" });
  });

  test("should resolve FieldRef in startsWith to string", () => {
    const row = ["Alice", "Ali", 30, 90];
    const ref = new FieldRef("User", "lastName");
    const result = resolveFieldRefs(fc({ startsWith: ref }), row, titles);
    expect(result).toEqual({ startsWith: "Ali" });
  });

  test("should resolve FieldRef in endsWith to string", () => {
    const row = ["Alice", "ice", 30, 90];
    const ref = new FieldRef("User", "lastName");
    const result = resolveFieldRefs(fc({ endsWith: ref }), row, titles);
    expect(result).toEqual({ endsWith: "ice" });
  });

  test("should set undefined for non-existent column", () => {
    const row = ["Alice", "Bob", 30, 90];
    const ref = new FieldRef("User", "nonExistent");
    const result = resolveFieldRefs(fc({ equals: ref }), row, titles);
    expect(result).toEqual({ equals: undefined });
  });

  test("should preserve non-FieldRef properties", () => {
    const row = ["Alice", "Bob", 30, 90];
    const result = resolveFieldRefs(
      { not: "test", in: [1, 2], mode: "insensitive" },
      row,
      titles,
    );
    expect(result).toEqual({ not: "test", in: [1, 2], mode: "insensitive" });
  });

  test("should resolve multiple FieldRefs in same options", () => {
    const row = ["Alice", "Bob", 30, 90];
    const ref1 = new FieldRef("User", "age");
    const ref2 = new FieldRef("User", "score");
    const result = resolveFieldRefs(fc({ gte: ref1, lte: ref2 }), row, titles);
    expect(result).toEqual({ gte: 30, lte: 90 });
  });

  test("should return as-is when no FieldRef present", () => {
    const row = ["Alice", "Bob", 30, 90];
    const opts: FilterConditions = { equals: "Alice", mode: "insensitive" };
    const result = resolveFieldRefs(opts, row, titles);
    expect(result).toBe(opts);
  });
});
