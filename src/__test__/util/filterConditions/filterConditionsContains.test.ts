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

  test("should treat dot as literal character, not regex wildcard", () => {
    expect(isFilterConditionsMatch("testXproduct", { contains: "t.p" })).toBe(
      false,
    );
    expect(isFilterConditionsMatch("test.product", { contains: "t.p" })).toBe(
      true,
    );
  });

  test("should treat .* as literal string, not regex wildcard", () => {
    expect(isFilterConditionsMatch("hello", { contains: ".*" })).toBe(false);
    expect(isFilterConditionsMatch("file.*txt", { contains: ".*" })).toBe(true);
  });

  test("should treat regex meta characters as literal", () => {
    expect(isFilterConditionsMatch("abc", { contains: "+" })).toBe(false);
    expect(isFilterConditionsMatch("a+b", { contains: "+" })).toBe(true);
    expect(isFilterConditionsMatch("abc", { contains: "^" })).toBe(false);
    expect(isFilterConditionsMatch("a^b", { contains: "^" })).toBe(true);
    expect(isFilterConditionsMatch("abc", { contains: "$" })).toBe(false);
    expect(isFilterConditionsMatch("a$b", { contains: "$" })).toBe(true);
  });
});
