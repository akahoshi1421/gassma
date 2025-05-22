import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

describe("filterConditionsStartsWith", () => {
  test("should return true for matching prefix", () => {
    const cellData = "test";
    const filterOptions = { startsWith: "te" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for non-matching prefix", () => {
    const cellData = "test";
    const filterOptions = { startsWith: "not" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
  test("should return false for non-matching prefix2", () => {
    const cellData = "test";
    const filterOptions = { startsWith: "st" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
