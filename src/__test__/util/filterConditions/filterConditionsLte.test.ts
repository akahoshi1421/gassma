import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsLte", () => {
  test("should return true for less than or equal values", () => {
    const cellData = 5;
    const filterOptions = { lte: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should return false for greater than values", () => {
    const cellData = 15;
    const filterOptions = { lte: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should return true for equal values", () => {
    const cellData = 10;
    const filterOptions = { lte: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
});
