import { getSum } from "../../../../util/aggregate/aggregateUtil/sum";
import { GassmaAggregateSumError, GassmaAggregateSumTypeError } from "../../../../errors/aggregate/aggregateError";

describe("getSum", () => {
  test("should calculate sum for numeric data", () => {
    const rows = [
      { age: 10, score: 80 },
      { age: 20, score: 90 },
      { age: 30, score: 70 }
    ];
    const result = getSum(rows, { age: true, score: true });
    
    expect(result).toEqual({
      age: 60,
      score: 240
    });
  });

  test("should return null for fields with no data after filtering nulls", () => {
    const rows = [
      { age: null, score: undefined },
      { age: null, score: null }
    ];
    const result = getSum(rows, { age: true, score: true });
    
    expect(result).toEqual({
      age: null,
      score: null
    });
  });

  test("should handle mixed null and numeric values", () => {
    const rows = [
      { age: 10, score: null },
      { age: null, score: 80 },
      { age: 30, score: 90 }
    ];
    const result = getSum(rows, { age: true, score: true });
    
    expect(result).toEqual({
      age: 40,
      score: 170
    });
  });

  test("should throw GassmaAggregateSumError for mixed data types", () => {
    const rows = [
      { field: 10 },
      { field: "string" },
      { field: 30 }
    ];
    
    try {
      getSum(rows, { field: true });
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error.message).toBe("Cannot produce a maximum value of more than one type.");
    }
  });

  test("should throw GassmaAggregateSumTypeError for non-numeric uniform data types", () => {
    const rows = [
      { field: "string1" },
      { field: "string2" },
      { field: "string3" }
    ];
    
    try {
      getSum(rows, { field: true });
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error.message).toContain("number");
    }
  });

  test("should throw GassmaAggregateSumTypeError for boolean data", () => {
    const rows = [
      { field: true },
      { field: false },
      { field: true }
    ];
    
    try {
      getSum(rows, { field: true });
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error.message).toContain("number");
    }
  });

  test("should throw GassmaAggregateSumTypeError for Date data", () => {
    const date1 = new Date("2023-01-01");
    const date2 = new Date("2023-01-02");
    const rows = [
      { field: date1 },
      { field: date2 }
    ];
    
    try {
      getSum(rows, { field: true });
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error.message).toContain("number");
    }
  });

  test("should handle empty rows array", () => {
    const rows: any[] = [];
    const result = getSum(rows, { age: true });
    
    expect(result).toEqual({
      age: null
    });
  });

  test("should handle single numeric value", () => {
    const rows = [
      { field: 42 }
    ];
    const result = getSum(rows, { field: true });
    
    expect(result).toEqual({
      field: 42
    });
  });

  test("should handle zero values", () => {
    const rows = [
      { field: 0 },
      { field: 10 },
      { field: 0 }
    ];
    const result = getSum(rows, { field: true });
    
    expect(result).toEqual({
      field: 10
    });
  });

  test("should handle negative numbers", () => {
    const rows = [
      { field: -5 },
      { field: 10 },
      { field: -3 }
    ];
    const result = getSum(rows, { field: true });
    
    expect(result).toEqual({
      field: 2
    });
  });

  test("should handle multiple fields with different scenarios", () => {
    const rows = [
      { numeric: 10, allNull: null, mixed: 5 },
      { numeric: 20, allNull: null, mixed: "string" }
    ];
    
    try {
      getSum(rows, { numeric: true, allNull: true, mixed: true });
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error.message).toBe("Cannot produce a maximum value of more than one type.");
    }
  });
});