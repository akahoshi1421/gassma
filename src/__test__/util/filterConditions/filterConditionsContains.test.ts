import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

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

  test("should return false when cellData is null", () => {
    const cellData = null;
    const filterOptions = { contains: "test" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should handle numeric values converted to string", () => {
    const cellData = 123;
    const filterOptions = { contains: "2" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should match case-insensitively when mode is insensitive", () => {
    const cellData = "Hello World";
    const filterOptions = { contains: "hello", mode: "insensitive" as const };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should return false for non-matching substring with mode insensitive", () => {
    const cellData = "Hello World";
    const filterOptions = { contains: "xyz", mode: "insensitive" as const };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
