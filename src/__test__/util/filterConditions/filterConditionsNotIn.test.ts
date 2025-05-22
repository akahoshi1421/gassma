import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

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
});
