import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

describe("filterConditionsEndsWith", () => {
  test("should return true for matching suffix", () => {
    const cellData = "test";
    const filterOptions = { endsWith: "st" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for non-matching suffix", () => {
    const cellData = "test";
    const filterOptions = { endsWith: "not" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
  test("should return false for non-matching suffix2", () => {
    const cellData = "test";
    const filterOptions = { endsWith: "te" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
