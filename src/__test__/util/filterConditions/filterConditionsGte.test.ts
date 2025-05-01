import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsGte", () => {
  test("should return true for greater than or equal values", () => {
    const cellData = 15;
    const filterOptions = { gte: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for less than values", () => {
    const cellData = 5;
    const filterOptions = { gte: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
  test("should return true for equal values", () => {
    const cellData = 10;
    const filterOptions = { gte: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
});
