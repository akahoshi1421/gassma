import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsEquals", () => {
  test("should return true for equal values", () => {
    const cellData = "test";
    const filterOptions = { equals: "test" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for unequal values", () => {
    const cellData = "test";
    const filterOptions = { equals: "notTest" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
