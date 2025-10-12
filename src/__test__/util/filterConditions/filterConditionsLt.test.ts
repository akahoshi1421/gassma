import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsLt", () => {
  test("should return true for less than condition", () => {
    const cellData = 5;
    const filterOptions = { lt: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  
  test("should return false for equal condition", () => {
    const cellData = 10;
    const filterOptions = { lt: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should return false when cellData is null", () => {
    const cellData = null;
    const filterOptions = { lt: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should return false for greater than condition", () => {
    const cellData = 15;
    const filterOptions = { lt: 10 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
