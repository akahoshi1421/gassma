import type { FilterConditions } from "../../../types/coreTypes";
import { FieldRef } from "../../../util/filterConditions/fieldRef";
import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";
import { resolveFieldRefs } from "../../../util/filterConditions/resolveFieldRefs";

const fc = (obj: Record<string, unknown>) => obj as FilterConditions;

describe("filterConditions with FieldRef (resolveFieldRefs + isFilterConditionsMatch)", () => {
  const titles = ["firstName", "lastName", "age", "score"];

  describe("equals", () => {
    test("should match when column values are equal", () => {
      const row = ["Alice", "Alice", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ equals: new FieldRef("User", "lastName") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("Alice", resolved)).toBe(true);
    });

    test("should not match when column values differ", () => {
      const row = ["Alice", "Bob", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ equals: new FieldRef("User", "lastName") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("Alice", resolved)).toBe(false);
    });

    test("should not match when referenced column does not exist", () => {
      const row = ["Alice", "Bob", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ equals: new FieldRef("User", "nonExistent") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("Alice", resolved)).toBe(false);
    });

    test("should work with insensitive mode", () => {
      const row = ["alice", "ALICE", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ equals: new FieldRef("User", "lastName"), mode: "insensitive" }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("alice", resolved)).toBe(true);
    });
  });

  describe("lt/lte/gt/gte", () => {
    test("lt should match when cellData < referenced value", () => {
      const row = ["A", "B", 20, 90];
      const resolved = resolveFieldRefs(
        fc({ lt: new FieldRef("User", "score") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch(20, resolved)).toBe(true);
    });

    test("lte should match when cellData == referenced value", () => {
      const row = ["A", "B", 90, 90];
      const resolved = resolveFieldRefs(
        fc({ lte: new FieldRef("User", "score") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch(90, resolved)).toBe(true);
    });

    test("gt should match when cellData > referenced value", () => {
      const row = ["A", "B", 100, 90];
      const resolved = resolveFieldRefs(
        fc({ gt: new FieldRef("User", "score") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch(100, resolved)).toBe(true);
    });

    test("gte should not match when cellData < referenced value", () => {
      const row = ["A", "B", 80, 90];
      const resolved = resolveFieldRefs(
        fc({ gte: new FieldRef("User", "score") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch(80, resolved)).toBe(false);
    });
  });

  describe("contains/startsWith/endsWith", () => {
    test("contains should match substring", () => {
      const row = ["Alice Smith", "Smith", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ contains: new FieldRef("User", "lastName") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("Alice Smith", resolved)).toBe(true);
    });

    test("startsWith should match prefix", () => {
      const row = ["Alice Smith", "Alice", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ startsWith: new FieldRef("User", "lastName") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("Alice Smith", resolved)).toBe(true);
    });

    test("endsWith should match suffix", () => {
      const row = ["Alice Smith", "Smith", 30, 90];
      const resolved = resolveFieldRefs(
        fc({ endsWith: new FieldRef("User", "lastName") }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("Alice Smith", resolved)).toBe(true);
    });

    test("contains with insensitive mode", () => {
      const row = ["alice smith", "SMITH", 30, 90];
      const resolved = resolveFieldRefs(
        fc({
          contains: new FieldRef("User", "lastName"),
          mode: "insensitive",
        }),
        row,
        titles,
      );
      expect(isFilterConditionsMatch("alice smith", resolved)).toBe(true);
    });
  });

  describe("backward compatibility", () => {
    test("should still work with plain values", () => {
      expect(isFilterConditionsMatch("test", { equals: "test" })).toBe(true);
      expect(isFilterConditionsMatch(10, { lt: 20 })).toBe(true);
      expect(isFilterConditionsMatch("hello", { contains: "ell" })).toBe(true);
    });
  });
});
