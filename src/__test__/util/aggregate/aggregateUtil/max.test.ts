import { getMax } from "../../../../util/aggregate/aggregateUtil/max";
import { getBooleanMax } from "../../../../util/aggregate/aggregateUtil/max/booleanMax";
import { getDateMax } from "../../../../util/aggregate/aggregateUtil/max/dateMax";
import { getStringMax } from "../../../../util/aggregate/aggregateUtil/max/stringMax";

describe("max aggregate functionality tests", () => {
  describe("getMax function", () => {
    test("should calculate max for number field", () => {
      const rows = [
        { age: 25 },
        { age: 30 },
        { age: 20 },
        { age: 35 }
      ];
      const result = getMax(rows, { age: true });
      expect(result).toEqual({ age: 35 });
    });

    test("should calculate max for string field", () => {
      const rows = [
        { name: "Charlie" },
        { name: "Alice" },
        { name: "Bob" },
        { name: "David" }
      ];
      const result = getMax(rows, { name: true });
      expect(result).toEqual({ name: "David" });
    });

    test("should calculate max for boolean field", () => {
      const rows = [
        { active: true },
        { active: false },
        { active: true }
      ];
      const result = getMax(rows, { active: true });
      expect(result).toEqual({ active: true });
    });

    test("should calculate max for date field", () => {
      const date1 = new Date("2023-01-01");
      const date2 = new Date("2023-06-01");
      const date3 = new Date("2022-12-01");
      const rows = [
        { created: date1 },
        { created: date2 },
        { created: date3 }
      ];
      const result = getMax(rows, { created: true });
      expect(result).toEqual({ created: date2 });
    });

    test("should handle null and undefined values", () => {
      const rows = [
        { age: 25 },
        { age: null },
        { age: undefined },
        { age: 20 },
        { age: 30 }
      ];
      const result = getMax(rows, { age: true });
      expect(result).toEqual({ age: 30 });
    });

    test("should return null when all values are null or undefined", () => {
      const rows = [
        { age: null },
        { age: undefined },
        { age: null }
      ];
      const result = getMax(rows, { age: true });
      expect(result).toEqual({ age: null });
    });

    test("should return null when no rows provided", () => {
      const rows: any[] = [];
      const result = getMax(rows, { age: true });
      expect(result).toEqual({ age: null });
    });

    test("should handle multiple fields", () => {
      const rows = [
        { age: 30, name: "Charlie", active: true },
        { age: 25, name: "Alice", active: false },
        { age: 35, name: "Bob", active: true }
      ];
      const result = getMax(rows, { age: true, name: true, active: true });
      expect(result).toEqual({ age: 35, name: "Charlie", active: true });
    });

    test("should throw error for unsupported data types", () => {
      const rows = [
        { obj: { value: 1 } },
        { obj: { value: 2 } }
      ];
      expect(() => {
        getMax(rows, { obj: true });
      }).toThrow();
    });
  });

  describe("getBooleanMax function", () => {
    test("should return true when array contains true", () => {
      const result = getBooleanMax([true, false, true]);
      expect(result).toBe(true);
    });

    test("should return true when all values are true", () => {
      const result = getBooleanMax([true, true, true]);
      expect(result).toBe(true);
    });

    test("should return false when all values are false", () => {
      const result = getBooleanMax([false, false, false]);
      expect(result).toBe(false);
    });

    test("should handle single boolean value", () => {
      expect(getBooleanMax([true])).toBe(true);
      expect(getBooleanMax([false])).toBe(false);
    });

    test("should handle mixed boolean values correctly", () => {
      expect(getBooleanMax([false, true])).toBe(true);
      expect(getBooleanMax([true, false, true, false])).toBe(true);
    });
  });

  describe("getDateMax function", () => {
    test("should return latest date", () => {
      const date1 = new Date("2023-01-01");
      const date2 = new Date("2023-06-01");
      const date3 = new Date("2022-12-01");
      const result = getDateMax([date1, date2, date3]);
      expect(result).toEqual(date2);
    });

    test("should handle single date", () => {
      const date = new Date("2023-01-01");
      const result = getDateMax([date]);
      expect(result).toEqual(date);
    });

    test("should handle dates with different times", () => {
      const date1 = new Date("2023-01-01T10:00:00");
      const date2 = new Date("2023-01-01T08:00:00");
      const date3 = new Date("2023-01-01T12:00:00");
      const result = getDateMax([date1, date2, date3]);
      expect(result).toEqual(date3);
    });

    test("should handle dates across different years", () => {
      const date1 = new Date("2022-12-31");
      const date2 = new Date("2023-01-01");
      const date3 = new Date("2021-06-15");
      const result = getDateMax([date1, date2, date3]);
      expect(result).toEqual(date2);
    });

    test("should preserve exact date and time", () => {
      const date1 = new Date("2023-05-15T14:30:45.123Z");
      const date2 = new Date("2023-05-15T14:30:45.124Z");
      const result = getDateMax([date1, date2]);
      expect(result).toEqual(date2);
      expect(result.getTime()).toBe(date2.getTime());
    });
  });

  describe("getStringMax function", () => {
    test("should return lexicographically largest string", () => {
      const result = getStringMax(["Charlie", "Alice", "Bob", "David"]);
      expect(result).toBe("David");
    });

    test("should handle single string", () => {
      const result = getStringMax(["Hello"]);
      expect(result).toBe("Hello");
    });

    test("should handle case sensitivity correctly", () => {
      const result = getStringMax(["apple", "Apple", "APPLE"]);
      expect(result).toBe("apple"); // Lowercase comes after uppercase in Unicode
    });

    test("should handle strings with different lengths", () => {
      const result = getStringMax(["a", "aa", "aaa", "aaaa"]);
      expect(result).toBe("aaaa");
    });

    test("should handle empty strings", () => {
      const result = getStringMax(["", "a", "b"]);
      expect(result).toBe("b");
    });

    test("should handle strings with special characters", () => {
      const result = getStringMax(["hello", "hello!", "hello?"]);
      expect(result).toBe("hello?");
    });

    test("should handle strings with numbers", () => {
      const result = getStringMax(["abc10", "abc2", "abc1"]);
      expect(result).toBe("abc2");
    });

    test("should handle Japanese characters", () => {
      const result = getStringMax(["こんにちは", "あいうえお", "かきくけこ"]);
      expect(result).toBe("こんにちは");
    });

    test("should handle mixed character sets", () => {
      const result = getStringMax(["abc", "123", "あいう"]);
      expect(result).toBe("あいう"); // Japanese characters come after Latin in Unicode
    });

    test("should handle identical strings", () => {
      const result = getStringMax(["test", "test", "test"]);
      expect(result).toBe("test");
    });

    test("should handle strings with prefix relationships", () => {
      const result = getStringMax(["test", "testing", "tester"]);
      expect(result).toBe("testing");
    });

    test("should handle complex Unicode characters", () => {
      const result = getStringMax(["🌟", "🌈", "🌙"]);
      expect(result).toBe("🌟");
    });

    test("should handle edge case with empty string and others", () => {
      const result = getStringMax(["", "a"]);
      expect(result).toBe("a");
    });

    test("should handle strings that are prefixes of each other", () => {
      const result = getStringMax(["hello", "helloworld", "hello!"]);
      expect(result).toBe("helloworld");
    });
  });

  describe("getMax error handling", () => {
    test("should handle array data type gracefully", () => {
      const rows = [
        { tags: ["a", "b"] },
        { tags: ["c", "d"] }
      ];
      expect(() => {
        getMax(rows, { tags: true });
      }).toThrow();
    });

    test("should handle object data type gracefully", () => {
      const rows = [
        { metadata: { key: "value1" } },
        { metadata: { key: "value2" } }
      ];
      expect(() => {
        getMax(rows, { metadata: true });
      }).toThrow();
    });

    test("should handle mixed data types gracefully", () => {
      const rows = [
        { value: "string" },
        { value: 123 },
        { value: true }
      ];
      expect(() => {
        getMax(rows, { value: true });
      }).toThrow();
    });
  });

  describe("getMax edge cases", () => {
    test("should handle very large numbers", () => {
      const rows = [
        { value: Number.MAX_SAFE_INTEGER },
        { value: Number.MAX_SAFE_INTEGER - 1 },
        { value: Number.MAX_SAFE_INTEGER - 2 }
      ];
      const result = getMax(rows, { value: true });
      expect(result).toEqual({ value: Number.MAX_SAFE_INTEGER });
    });

    test("should handle negative numbers", () => {
      const rows = [
        { value: -10 },
        { value: -5 },
        { value: -20 }
      ];
      const result = getMax(rows, { value: true });
      expect(result).toEqual({ value: -5 });
    });

    test("should handle decimal numbers", () => {
      const rows = [
        { value: 3.14 },
        { value: 2.71 },
        { value: 1.41 }
      ];
      const result = getMax(rows, { value: true });
      expect(result).toEqual({ value: 3.14 });
    });

    test("should handle zero values", () => {
      const rows = [
        { value: 0 },
        { value: 1 },
        { value: -1 }
      ];
      const result = getMax(rows, { value: true });
      expect(result).toEqual({ value: 1 });
    });

    test("should handle infinity values", () => {
      const rows = [
        { value: Number.POSITIVE_INFINITY },
        { value: 1000 },
        { value: Number.NEGATIVE_INFINITY }
      ];
      const result = getMax(rows, { value: true });
      expect(result).toEqual({ value: Number.POSITIVE_INFINITY });
    });
  });
});