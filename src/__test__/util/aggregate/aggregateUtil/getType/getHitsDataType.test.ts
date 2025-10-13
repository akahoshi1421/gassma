import { getHitsDataType } from "../../../../../util/aggregate/aggregateUtil/getType/getHitsDataType";

describe("getHitsDataType function tests", () => {
  describe("single data type arrays", () => {
    test("should return 'string' for string arrays", () => {
      const result = getHitsDataType(["hello", "world", "test"]);
      expect(result).toBe("string");
    });

    test("should return 'number' for number arrays", () => {
      const result = getHitsDataType([1, 2, 3, 4.5, -10]);
      expect(result).toBe("number");
    });

    test("should return 'boolean' for boolean arrays", () => {
      const result = getHitsDataType([true, false, true]);
      expect(result).toBe("boolean");
    });

    test("should return 'Date' for Date arrays", () => {
      const dates = [
        new Date("2023-01-01"),
        new Date("2023-06-01"),
        new Date("2022-12-01"),
      ];
      const result = getHitsDataType(dates);
      expect(result).toBe("Date");
    });

    test("should return 'undefined' for undefined arrays", () => {
      const result = getHitsDataType([undefined, undefined, undefined]);
      expect(result).toBe("undefined");
    });

    test("should return 'object' for object arrays (non-Date)", () => {
      const result = getHitsDataType([
        {} as any,
        { key: "value" } as any,
        { a: 1 } as any,
      ]);
      expect(result).toBe("object");
    });
  });

  describe("single element arrays", () => {
    test("should handle single string element", () => {
      const result = getHitsDataType(["test"]);
      expect(result).toBe("string");
    });

    test("should handle single number element", () => {
      const result = getHitsDataType([42]);
      expect(result).toBe("number");
    });

    test("should handle single boolean element", () => {
      const result = getHitsDataType([true]);
      expect(result).toBe("boolean");
    });

    test("should handle single Date element", () => {
      const result = getHitsDataType([new Date("2023-01-01")]);
      expect(result).toBe("Date");
    });
  });

  describe("mixed data type arrays", () => {
    test("should return false for mixed string and number", () => {
      const result = getHitsDataType(["hello", 123, "world"]);
      expect(result).toBe(false);
    });

    test("should return false for mixed boolean and string", () => {
      const result = getHitsDataType([true, "test", false]);
      expect(result).toBe(false);
    });

    test("should return false for mixed number and boolean", () => {
      const result = getHitsDataType([1, true, 2, false]);
      expect(result).toBe(false);
    });

    test("should return false for Date and object mix", () => {
      const result = getHitsDataType([new Date(), { key: "value" } as any]);
      expect(result).toBe(false);
    });

    test("should return false for Date and string mix", () => {
      const result = getHitsDataType([new Date("2023-01-01"), "not a date"]);
      expect(result).toBe(false);
    });

    test("should return false for complex mixed types", () => {
      const result = getHitsDataType([
        "string",
        123,
        true,
        new Date(),
        { key: "value" } as any,
        undefined,
      ]);
      expect(result).toBe(false);
    });
  });

  describe("Date type specific tests (regression tests for bug fix)", () => {
    test("should correctly identify all Date objects", () => {
      const dates = [
        new Date("2023-01-01T00:00:00Z"),
        new Date("2023-06-15T12:30:45Z"),
        new Date("2022-12-31T23:59:59Z"),
      ];
      const result = getHitsDataType(dates);
      expect(result).toBe("Date");
    });

    test("should return false when mixing Date with other object types", () => {
      const mixed = [
        new Date("2023-01-01"),
        { notADate: true } as any,
        new Date("2023-06-01"),
      ];
      const result = getHitsDataType(mixed);
      expect(result).toBe(false);
    });

    test("should return false when Date is mixed with primitives", () => {
      const mixed = [new Date("2023-01-01"), "2023-01-01", 123456789];
      const result = getHitsDataType(mixed);
      expect(result).toBe(false);
    });

    test("should handle Date objects created in different ways", () => {
      const dates = [
        new Date(2023, 0, 1), // Year, month (0-indexed), day
        new Date("2023-06-15"),
        new Date(1672531200000), // Timestamp
      ];
      const result = getHitsDataType(dates);
      expect(result).toBe("Date");
    });
  });

  describe("edge cases", () => {
    test("should handle arrays with null values correctly", () => {
      const result = getHitsDataType([null, null, null]);
      expect(result).toBe("object"); // typeof null === 'object'
    });

    test("should handle arrays with function values", () => {
      const funcs = [() => {}, function () {}, function named() {}] as any[];
      const result = getHitsDataType(funcs);
      expect(result).toBe("function");
    });

    test("should handle arrays with symbol values", () => {
      const symbols = [Symbol("a"), Symbol("b"), Symbol("c")] as any[];
      const result = getHitsDataType(symbols);
      expect(result).toBe("symbol");
    });

    test("should handle arrays with bigint values", () => {
      const bigints = [BigInt(123), BigInt(456), BigInt(789)] as any[];
      const result = getHitsDataType(bigints);
      expect(result).toBe("bigint");
    });
  });
});
