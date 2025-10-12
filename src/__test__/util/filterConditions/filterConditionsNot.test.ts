import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

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

  test("should convert empty string to null and match non-null cellData", () => {
    const cellData = "test";
    const filterOptions = { not: "" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should convert empty string to null and not match null cellData", () => {
    const cellData = null;
    const filterOptions = { not: "" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should handle numeric inequality", () => {
    const cellData = 42;
    const filterOptions = { not: 43 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should handle boolean inequality", () => {
    const cellData = true;
    const filterOptions = { not: false };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });
});
