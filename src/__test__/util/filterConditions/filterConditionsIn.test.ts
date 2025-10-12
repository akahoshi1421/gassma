import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsIn", () => {
  test("should return true for matching values", () => {
    const cellData = "test";
    const filterOptions = { in: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  
  test("should return false for non-matching values", () => {
    const cellData = "test3";
    const filterOptions = { in: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should return false when cellData is null", () => {
    const cellData = null;
    const filterOptions = { in: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should handle numeric values", () => {
    const cellData = 42;
    const filterOptions = { in: [42, 43, 44] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should handle boolean values", () => {
    const cellData = true;
    const filterOptions = { in: [true, false] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
});
