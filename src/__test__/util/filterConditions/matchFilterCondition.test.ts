import type { FilterConditions } from "../../../types/coreTypes";
import { FieldRef } from "../../../util/filterConditions/fieldRef";
import { matchFilterCondition } from "../../../util/filterConditions/matchFilterCondition";

const fc = (obj: Record<string, unknown>) => obj as FilterConditions;

describe("matchFilterCondition", () => {
  const titles = ["firstName", "lastName", "age", "score"];

  describe("equals with FieldRef", () => {
    test("should match when column values are equal", () => {
      const row = ["Alice", "Alice", 30, 90];
      expect(
        matchFilterCondition(
          "Alice",
          fc({ equals: new FieldRef("User", "lastName") }),
          row,
          titles,
        ),
      ).toBe(true);
    });

    test("should not match when column values differ", () => {
      const row = ["Alice", "Bob", 30, 90];
      expect(
        matchFilterCondition(
          "Alice",
          fc({ equals: new FieldRef("User", "lastName") }),
          row,
          titles,
        ),
      ).toBe(false);
    });

    test("should not match when referenced column does not exist", () => {
      const row = ["Alice", "Bob", 30, 90];
      expect(
        matchFilterCondition(
          "Alice",
          fc({ equals: new FieldRef("User", "nonExistent") }),
          row,
          titles,
        ),
      ).toBe(false);
    });

    test("should work with insensitive mode", () => {
      const row = ["alice", "ALICE", 30, 90];
      expect(
        matchFilterCondition(
          "alice",
          fc({
            equals: new FieldRef("User", "lastName"),
            mode: "insensitive",
          }),
          row,
          titles,
        ),
      ).toBe(true);
    });
  });

  describe("lt/lte/gt/gte with FieldRef", () => {
    test("lt should match", () => {
      const row = ["A", "B", 20, 90];
      expect(
        matchFilterCondition(
          20,
          fc({ lt: new FieldRef("User", "score") }),
          row,
          titles,
        ),
      ).toBe(true);
    });

    test("lte should match equal", () => {
      const row = ["A", "B", 90, 90];
      expect(
        matchFilterCondition(
          90,
          fc({ lte: new FieldRef("User", "score") }),
          row,
          titles,
        ),
      ).toBe(true);
    });

    test("gt should match", () => {
      const row = ["A", "B", 100, 90];
      expect(
        matchFilterCondition(
          100,
          fc({ gt: new FieldRef("User", "score") }),
          row,
          titles,
        ),
      ).toBe(true);
    });

    test("gte should not match when less", () => {
      const row = ["A", "B", 80, 90];
      expect(
        matchFilterCondition(
          80,
          fc({ gte: new FieldRef("User", "score") }),
          row,
          titles,
        ),
      ).toBe(false);
    });
  });

  describe("contains/startsWith/endsWith with FieldRef", () => {
    test("contains should match substring", () => {
      const row = ["Alice Smith", "Smith", 30, 90];
      expect(
        matchFilterCondition(
          "Alice Smith",
          fc({ contains: new FieldRef("User", "lastName") }),
          row,
          titles,
        ),
      ).toBe(true);
    });

    test("startsWith should match prefix", () => {
      const row = ["Alice Smith", "Alice", 30, 90];
      expect(
        matchFilterCondition(
          "Alice Smith",
          fc({ startsWith: new FieldRef("User", "lastName") }),
          row,
          titles,
        ),
      ).toBe(true);
    });

    test("endsWith should match suffix", () => {
      const row = ["Alice Smith", "Smith", 30, 90];
      expect(
        matchFilterCondition(
          "Alice Smith",
          fc({ endsWith: new FieldRef("User", "lastName") }),
          row,
          titles,
        ),
      ).toBe(true);
    });
  });

  describe("backward compatibility (no FieldRef)", () => {
    test("should delegate to isFilterConditionsMatch for plain values", () => {
      expect(matchFilterCondition("test", { equals: "test" }, [], [])).toBe(
        true,
      );
      expect(matchFilterCondition(10, { lt: 20 }, [], [])).toBe(true);
      expect(matchFilterCondition("hello", { contains: "ell" }, [], [])).toBe(
        true,
      );
    });
  });
});
