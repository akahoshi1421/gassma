import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsNotIn", () => {
  test("should return true for non-matching values", () => {
    const cellData = "test3";
    const filterOptions = { notIn: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  
  test("should return false for matching values", () => {
    const cellData = "test";
    const filterOptions = { notIn: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should return false when cellData is null", () => {
    const cellData = null;
    const filterOptions = { notIn: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should handle numeric values", () => {
    const cellData = 45;
    const filterOptions = { notIn: [42, 43, 44] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should handle boolean values", () => {
    const cellData = false;
    const filterOptions = { notIn: [true] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
});
