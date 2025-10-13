import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsGeneral", () => {
  describe("lt gt lte gte", () => {
    test("should return true for lt and gt conditions", () => {
      const cellData = 5;
      const filterOptions = { lt: 10, gt: 1 };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
    });
    test("should return false for lt and gt conditions", () => {
      const cellData = 5;
      const filterOptions = { lt: 20, gt: 10 };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
    });
    test("should return true for lte and gte conditions", () => {
      const cellData = 5;
      const filterOptions = { lte: 10, gte: 1 };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
    });
    test("should return false for lte and gte conditions", () => {
      const cellData = 5;
      const filterOptions = { lte: 10, gte: 20 };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
    });
  });

  describe("contains", () => {
    test("should return true for contains and startsWith and endsWith conditions", () => {
      const cellData = "hello world";
      const filterOptions = {
        contains: "lo",
        startsWith: "he",
        endsWith: "ld",
      };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
    });
    test("should return false for contains and startsWith and endsWith conditions", () => {
      const cellData = "hello world";
      const filterOptions = {
        contains: "lo",
        startsWith: "he",
        endsWith: "xyz",
      };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
    });
    test("should return false for contains and startsWith and endsWith conditions2", () => {
      const cellData = "hello world";
      const filterOptions = {
        contains: "lo",
        startsWith: "xyz",
        endsWith: "ld",
      };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
    });
    test("should return false for contains and startsWith and endsWith conditions3", () => {
      const cellData = "hello world";
      const filterOptions = {
        contains: "xyz",
        startsWith: "he",
        endsWith: "ld",
      };
      expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
    });
  });
});
