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

  test("should convert empty string to null and match null cellData", () => {
    const cellData = null;
    const filterOptions = { equals: "" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should convert empty string to null and not match non-null cellData", () => {
    const cellData = "test";
    const filterOptions = { equals: "" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should handle numeric equality", () => {
    const cellData = 42;
    const filterOptions = { equals: 42 };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should handle boolean equality", () => {
    const cellData = true;
    const filterOptions = { equals: true };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should match case-insensitively when mode is insensitive", () => {
    const cellData = "Hello";
    const filterOptions = { equals: "hello", mode: "insensitive" as const };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should return false for non-matching string with mode insensitive", () => {
    const cellData = "Hello";
    const filterOptions = { equals: "world", mode: "insensitive" as const };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should use normal comparison for non-string values with mode insensitive", () => {
    const cellData = 42;
    const filterOptions = { equals: 42, mode: "insensitive" as const };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should match Dates with the same time but different instances", () => {
    const cellData = new Date("2026-07-18T09:30:00.000Z");
    const filterOptions = { equals: new Date("2026-07-18T09:30:00.000Z") };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
  });

  test("should not match Dates with different times", () => {
    const cellData = new Date("2026-07-18T09:30:00.000Z");
    const filterOptions = { equals: new Date("2026-07-18T10:00:00.000Z") };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should not match Date cell against ISO string filter", () => {
    const cellData = new Date("2026-07-18T09:30:00.000Z");
    const filterOptions = { equals: "2026-07-18T09:30:00.000Z" };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });

  test("should not match string cell against Date filter", () => {
    const cellData = "2026-07-18T09:30:00.000Z";
    const filterOptions = { equals: new Date("2026-07-18T09:30:00.000Z") };
    expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
  });
});
