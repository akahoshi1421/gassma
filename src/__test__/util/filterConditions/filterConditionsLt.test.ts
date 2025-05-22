import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

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
});
