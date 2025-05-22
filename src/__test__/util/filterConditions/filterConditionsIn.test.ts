import { isFilterConditionsMatch } from "../../../app/util/filterConditions/filterConditions";

describe("filterConditionsIn", () => {
  test("should return true for matching values", () => {
    const cellData = "test";
    const filterOptions = { in: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
  test("should return false for non-matching values", () => {
    const cellData = "test3";
    const filterOptions = { in: ["test", "test2"] };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
