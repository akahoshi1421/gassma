import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsGt", () => {
  test("should return true for greater than values", () => {
    const cellData = 15;
    const filterOptions = { gt: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for less than or equal values", () => {
    const cellData = 5;
    const filterOptions = { gt: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
