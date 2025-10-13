import { getMin } from "../../../../util/aggregate/aggregateUtil/min";
import { getBooleanMin } from "../../../../util/aggregate/aggregateUtil/min/booleanMin";
import { getDateMin } from "../../../../util/aggregate/aggregateUtil/min/dateMin";
import { getStringMin } from "../../../../util/aggregate/aggregateUtil/min/stringMin";

describe("min aggregate functionality tests", () => {
	describe("getMin function", () => {
		test("should calculate min for number field", () => {
			const rows = [{ age: 25 }, { age: 30 }, { age: 20 }, { age: 35 }];
			const result = getMin(rows, { age: true });
			expect(result).toEqual({ age: 20 });
		});

		test("should calculate min for string field", () => {
			const rows = [
				{ name: "Charlie" },
				{ name: "Alice" },
				{ name: "Bob" },
				{ name: "David" },
			];
			const result = getMin(rows, { name: true });
			expect(result).toEqual({ name: "Alice" });
		});

		test("should calculate min for boolean field", () => {
			const rows = [{ active: true }, { active: false }, { active: true }];
			const result = getMin(rows, { active: true });
			expect(result).toEqual({ active: false });
		});

		test("should calculate min for date field", () => {
			const date1 = new Date("2023-01-01");
			const date2 = new Date("2023-06-01");
			const date3 = new Date("2022-12-01");
			const rows = [{ created: date1 }, { created: date2 }, { created: date3 }];
			const result = getMin(rows, { created: true });
			expect(result).toEqual({ created: date3 });
		});

		test("should handle null and undefined values", () => {
			const rows = [
				{ age: 25 },
				{ age: null },
				{ age: undefined },
				{ age: 20 },
				{ age: 30 },
			];
			const result = getMin(rows, { age: true });
			expect(result).toEqual({ age: 20 });
		});

		test("should return null when all values are null or undefined", () => {
			const rows = [{ age: null }, { age: undefined }, { age: null }];
			const result = getMin(rows, { age: true });
			expect(result).toEqual({ age: null });
		});

		test("should return null when no rows provided", () => {
			const rows: any[] = [];
			const result = getMin(rows, { age: true });
			expect(result).toEqual({ age: null });
		});

		test("should handle multiple fields", () => {
			const rows = [
				{ age: 30, name: "Charlie", active: true },
				{ age: 25, name: "Alice", active: false },
				{ age: 35, name: "Bob", active: true },
			];
			const result = getMin(rows, { age: true, name: true, active: true });
			expect(result).toEqual({ age: 25, name: "Alice", active: false });
		});

		test("should throw error for unsupported data types", () => {
			const rows = [{ obj: { value: 1 } }, { obj: { value: 2 } }];
			expect(() => {
				getMin(rows, { obj: true });
			}).toThrow();
		});
	});

	describe("getBooleanMin function", () => {
		test("should return false when array contains false", () => {
			const result = getBooleanMin([true, false, true]);
			expect(result).toBe(false);
		});

		test("should return true when all values are true", () => {
			const result = getBooleanMin([true, true, true]);
			expect(result).toBe(true);
		});

		test("should return false when all values are false", () => {
			const result = getBooleanMin([false, false, false]);
			expect(result).toBe(false);
		});

		test("should handle single boolean value", () => {
			expect(getBooleanMin([true])).toBe(true);
			expect(getBooleanMin([false])).toBe(false);
		});

		test("should handle mixed boolean values correctly", () => {
			expect(getBooleanMin([false, true])).toBe(false);
			expect(getBooleanMin([true, false, true, false])).toBe(false);
		});
	});

	describe("getDateMin function", () => {
		test("should return earliest date", () => {
			const date1 = new Date("2023-01-01");
			const date2 = new Date("2023-06-01");
			const date3 = new Date("2022-12-01");
			const result = getDateMin([date1, date2, date3]);
			expect(result).toEqual(date3);
		});

		test("should handle single date", () => {
			const date = new Date("2023-01-01");
			const result = getDateMin([date]);
			expect(result).toEqual(date);
		});

		test("should handle dates with different times", () => {
			const date1 = new Date("2023-01-01T10:00:00");
			const date2 = new Date("2023-01-01T08:00:00");
			const date3 = new Date("2023-01-01T12:00:00");
			const result = getDateMin([date1, date2, date3]);
			expect(result).toEqual(date2);
		});

		test("should handle dates across different years", () => {
			const date1 = new Date("2022-12-31");
			const date2 = new Date("2023-01-01");
			const date3 = new Date("2021-06-15");
			const result = getDateMin([date1, date2, date3]);
			expect(result).toEqual(date3);
		});

		test("should preserve exact date and time", () => {
			const date1 = new Date("2023-05-15T14:30:45.123Z");
			const date2 = new Date("2023-05-15T14:30:45.122Z");
			const result = getDateMin([date1, date2]);
			expect(result).toEqual(date2);
			expect(result.getTime()).toBe(date2.getTime());
		});
	});

	describe("getStringMin function", () => {
		test("should return lexicographically smallest string", () => {
			const result = getStringMin(["Charlie", "Alice", "Bob", "David"]);
			expect(result).toBe("Alice");
		});

		test("should handle single string", () => {
			const result = getStringMin(["Hello"]);
			expect(result).toBe("Hello");
		});

		test("should handle case sensitivity correctly", () => {
			const result = getStringMin(["apple", "Apple", "APPLE"]);
			expect(result).toBe("APPLE"); // Uppercase comes before lowercase in Unicode
		});

		test("should handle strings with different lengths", () => {
			const result = getStringMin(["a", "aa", "aaa", "aaaa"]);
			expect(result).toBe("a");
		});

		test("should handle empty strings", () => {
			const result = getStringMin(["", "a", "b"]);
			expect(result).toBe("");
		});

		test("should handle strings with special characters", () => {
			const result = getStringMin(["hello", "hello!", "hello?"]);
			expect(result).toBe("hello");
		});

		test("should handle strings with numbers", () => {
			const result = getStringMin(["abc10", "abc2", "abc1"]);
			expect(result).toBe("abc1");
		});

		test("should handle Japanese characters", () => {
			const result = getStringMin(["こんにちは", "あいうえお", "かきくけこ"]);
			expect(result).toBe("あいうえお");
		});

		test("should handle mixed character sets", () => {
			const result = getStringMin(["abc", "123", "あいう"]);
			expect(result).toBe("123"); // Numbers come before letters in Unicode
		});

		test("should handle identical strings", () => {
			const result = getStringMin(["test", "test", "test"]);
			expect(result).toBe("test");
		});

		test("should handle strings with prefix relationships", () => {
			const result = getStringMin(["test", "testing", "tester"]);
			expect(result).toBe("test");
		});

		test("should handle complex Unicode characters", () => {
			const result = getStringMin(["🌟", "🌈", "🌙"]);
			expect(result).toBe("🌈");
		});
	});

	describe("getMin error handling", () => {
		test("should handle array data type gracefully", () => {
			const rows = [{ tags: ["a", "b"] }, { tags: ["c", "d"] }];
			expect(() => {
				getMin(rows, { tags: true });
			}).toThrow();
		});

		test("should handle object data type gracefully", () => {
			const rows = [
				{ metadata: { key: "value1" } },
				{ metadata: { key: "value2" } },
			];
			expect(() => {
				getMin(rows, { metadata: true });
			}).toThrow();
		});

		test("should handle mixed data types gracefully", () => {
			const rows = [{ value: "string" }, { value: 123 }, { value: true }];
			expect(() => {
				getMin(rows, { value: true });
			}).toThrow("Cannot produce a maximum value of more than one type.");
		});
	});

	describe("getMin edge cases", () => {
		test("should handle very large numbers", () => {
			const rows = [
				{ value: Number.MAX_SAFE_INTEGER },
				{ value: Number.MAX_SAFE_INTEGER - 1 },
				{ value: Number.MAX_SAFE_INTEGER - 2 },
			];
			const result = getMin(rows, { value: true });
			expect(result).toEqual({ value: Number.MAX_SAFE_INTEGER - 2 });
		});

		test("should handle negative numbers", () => {
			const rows = [{ value: -10 }, { value: -5 }, { value: -20 }];
			const result = getMin(rows, { value: true });
			expect(result).toEqual({ value: -20 });
		});

		test("should handle decimal numbers", () => {
			const rows = [{ value: 3.14 }, { value: 2.71 }, { value: 1.41 }];
			const result = getMin(rows, { value: true });
			expect(result).toEqual({ value: 1.41 });
		});

		test("should handle zero values", () => {
			const rows = [{ value: 0 }, { value: 1 }, { value: -1 }];
			const result = getMin(rows, { value: true });
			expect(result).toEqual({ value: -1 });
		});

		test("should handle infinity values", () => {
			const rows = [
				{ value: Number.POSITIVE_INFINITY },
				{ value: 1000 },
				{ value: Number.NEGATIVE_INFINITY },
			];
			const result = getMin(rows, { value: true });
			expect(result).toEqual({ value: Number.NEGATIVE_INFINITY });
		});
	});
});
