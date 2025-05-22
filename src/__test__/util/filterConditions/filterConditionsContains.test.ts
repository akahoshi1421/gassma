import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

describe("filterConditionsContains", () => {
  test("should return true for matching substring", () => {
    const cellData = "test";
    const filterOptions = { contains: "es" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for non-matching substring", () => {
    const cellData = "test";
    const filterOptions = { contains: "not" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
