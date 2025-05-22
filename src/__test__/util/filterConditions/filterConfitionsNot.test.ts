import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

describe("filterConditionsNot", () => {
  test("should return true for unequal values", () => {
    const cellData = "test";
    const filterOptions = { not: "notTest" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for equal values", () => {
    const cellData = "test";
    const filterOptions = { not: "test" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
