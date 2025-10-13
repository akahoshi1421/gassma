import { findManyFunc } from "../../../util/find/findMany";
import { findFirstFunc } from "../../../util/find/findFirst";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";
import { expectArrayToEqualIgnoringOrder } from "../../helpers/matchers";

describe("skip functionality tests", () => {
	describe("findManyFunc with skip", () => {
		test("should skip specified number of records", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: 2,
			});

			expect(result).toHaveLength(6); // 8 total - 2 skipped = 6
			expect(result).toEqual([
				{
					名前: "Charlie",
					年齢: 22,
					住所: "Tokyo",
					郵便番号: "100-0002",
					職業: "Student",
				},
				{
					名前: "David",
					年齢: 45,
					住所: "Kyoto",
					郵便番号: "600-8000",
					職業: "Manager",
				},
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
				{
					名前: "Frank",
					年齢: 52,
					住所: "Osaka",
					郵便番号: "550-0002",
					職業: "Director",
				},
				{
					名前: "Grace",
					年齢: 31,
					住所: "Tokyo",
					郵便番号: "100-0004",
					職業: "Designer",
				},
				{
					名前: "Henry",
					年齢: 28,
					住所: "Kyoto",
					郵便番号: "600-8001",
					職業: "Engineer",
				},
			]);
		});

		test("should skip no records when skip is 0", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: 0,
			});

			expect(result).toHaveLength(8); // All records
			expect(result).toEqual([
				{
					名前: "Alice",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0001",
					職業: "Engineer",
				},
				{
					名前: "Bob",
					年齢: 35,
					住所: "Osaka",
					郵便番号: "550-0001",
					職業: "Designer",
				},
				{
					名前: "Charlie",
					年齢: 22,
					住所: "Tokyo",
					郵便番号: "100-0002",
					職業: "Student",
				},
				{
					名前: "David",
					年齢: 45,
					住所: "Kyoto",
					郵便番号: "600-8000",
					職業: "Manager",
				},
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
				{
					名前: "Frank",
					年齢: 52,
					住所: "Osaka",
					郵便番号: "550-0002",
					職業: "Director",
				},
				{
					名前: "Grace",
					年齢: 31,
					住所: "Tokyo",
					郵便番号: "100-0004",
					職業: "Designer",
				},
				{
					名前: "Henry",
					年齢: 28,
					住所: "Kyoto",
					郵便番号: "600-8001",
					職業: "Engineer",
				},
			]);
		});

		test("should return empty array when skip exceeds total count", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: 20,
			});

			expect(result).toEqual([]);
		});

		test("should skip all but one record", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: 7,
			});

			expect(result).toHaveLength(1);
			expect(result).toEqual([
				{
					名前: "Henry",
					年齢: 28,
					住所: "Kyoto",
					郵便番号: "600-8001",
					職業: "Engineer",
				},
			]);
		});

		test("should work with where condition", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				where: { 住所: "Tokyo" },
				skip: 1,
			});

			expect(result).toHaveLength(3); // 4 Tokyo records - 1 skipped = 3
			expectArrayToEqualIgnoringOrder(result, [
				{
					名前: "Charlie",
					年齢: 22,
					住所: "Tokyo",
					郵便番号: "100-0002",
					職業: "Student",
				},
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
				{
					名前: "Grace",
					年齢: 31,
					住所: "Tokyo",
					郵便番号: "100-0004",
					職業: "Designer",
				},
			]);
		});

		test("should work with select", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				select: { 名前: true, 年齢: true },
				skip: 3,
			});

			expect(result).toHaveLength(5);
			expect(result).toEqual([
				{ 名前: "David", 年齢: 45 },
				{ 名前: "Eve", 年齢: 28 },
				{ 名前: "Frank", 年齢: 52 },
				{ 名前: "Grace", 年齢: 31 },
				{ 名前: "Henry", 年齢: 28 },
			]);
		});

		test("should work with orderBy", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				orderBy: { 年齢: "asc" },
				skip: 2,
			});

			expect(result).toHaveLength(6);
			expect(result).toEqual([
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
				{
					名前: "Henry",
					年齢: 28,
					住所: "Kyoto",
					郵便番号: "600-8001",
					職業: "Engineer",
				},
				{
					名前: "Grace",
					年齢: 31,
					住所: "Tokyo",
					郵便番号: "100-0004",
					職業: "Designer",
				},
				{
					名前: "Bob",
					年齢: 35,
					住所: "Osaka",
					郵便番号: "550-0001",
					職業: "Designer",
				},
				{
					名前: "David",
					年齢: 45,
					住所: "Kyoto",
					郵便番号: "600-8000",
					職業: "Manager",
				},
				{
					名前: "Frank",
					年齢: 52,
					住所: "Osaka",
					郵便番号: "550-0002",
					職業: "Director",
				},
			]);
		});

		test("should work with take (pagination)", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: 2,
				take: 3,
			});

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{
					名前: "Charlie",
					年齢: 22,
					住所: "Tokyo",
					郵便番号: "100-0002",
					職業: "Student",
				},
				{
					名前: "David",
					年齢: 45,
					住所: "Kyoto",
					郵便番号: "600-8000",
					職業: "Manager",
				},
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
			]);
		});

		test("should work with complex combination of options", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				where: { 年齢: { gte: 28 } },
				select: { 名前: true, 年齢: true, 職業: true },
				orderBy: { 年齢: "desc" },
				skip: 1,
				take: 3,
			});

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{ 名前: "David", 年齢: 45, 職業: "Manager" },
				{ 名前: "Bob", 年齢: 35, 職業: "Designer" },
				{ 名前: "Grace", 年齢: 31, 職業: "Designer" },
			]);
		});

		test("should work with omit", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				omit: { 郵便番号: true, 職業: true },
				skip: 5,
			});

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{ 名前: "Frank", 年齢: 52, 住所: "Osaka" },
				{ 名前: "Grace", 年齢: 31, 住所: "Tokyo" },
				{ 名前: "Henry", 年齢: 28, 住所: "Kyoto" },
			]);
		});

		test("should return empty array when filtered results are empty", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				where: { 名前: "NonExistent" },
				skip: 1,
			});

			expect(result).toEqual([]);
		});

		test("should skip within filtered results", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				where: { 年齢: 28 },
				skip: 1,
			});

			expect(result).toHaveLength(2); // 3 records with age 28 - 1 skipped = 2
			expectArrayToEqualIgnoringOrder(result, [
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
				{
					名前: "Henry",
					年齢: 28,
					住所: "Kyoto",
					郵便番号: "600-8001",
					職業: "Engineer",
				},
			]);
		});
	});

	describe("findManyFunc skip edge cases", () => {
		test("should handle negative skip values gracefully", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: -1,
			});

			expect(result).toHaveLength(8); // Should skip 0 records (treat negative as no skip)
		});

		test("should handle floating point skip values", () => {
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: 2.7,
			});

			expect(result).toHaveLength(6); // Should skip 2 records (floor the value)
		});
	});

	describe("pagination scenarios", () => {
		test("should implement basic pagination - page 1", () => {
			const pageSize = 3;
			const page = 1;
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: (page - 1) * pageSize,
				take: pageSize,
			});

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{
					名前: "Alice",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0001",
					職業: "Engineer",
				},
				{
					名前: "Bob",
					年齢: 35,
					住所: "Osaka",
					郵便番号: "550-0001",
					職業: "Designer",
				},
				{
					名前: "Charlie",
					年齢: 22,
					住所: "Tokyo",
					郵便番号: "100-0002",
					職業: "Student",
				},
			]);
		});

		test("should implement basic pagination - page 2", () => {
			const pageSize = 3;
			const page = 2;
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: (page - 1) * pageSize,
				take: pageSize,
			});

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{
					名前: "David",
					年齢: 45,
					住所: "Kyoto",
					郵便番号: "600-8000",
					職業: "Manager",
				},
				{
					名前: "Eve",
					年齢: 28,
					住所: "Tokyo",
					郵便番号: "100-0003",
					職業: "Engineer",
				},
				{
					名前: "Frank",
					年齢: 52,
					住所: "Osaka",
					郵便番号: "550-0002",
					職業: "Director",
				},
			]);
		});

		test("should implement basic pagination - last page", () => {
			const pageSize = 3;
			const page = 3;
			const result = findManyFunc(getExtendedMockControllerUtil(), {
				skip: (page - 1) * pageSize,
				take: pageSize,
			});

			expect(result).toHaveLength(2); // Only 2 records left
			expect(result).toEqual([
				{
					名前: "Grace",
					年齢: 31,
					住所: "Tokyo",
					郵便番号: "100-0004",
					職業: "Designer",
				},
				{
					名前: "Henry",
					年齢: 28,
					住所: "Kyoto",
					郵便番号: "600-8001",
					職業: "Engineer",
				},
			]);
		});
	});

	describe("findFirstFunc with skip", () => {
		test("should apply skip functionality correctly", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				where: { 職業: "Engineer" },
				skip: 1,
			});

			// Should skip the first Engineer (Alice) and return the second one (Eve)
			expect(result).toEqual({
				名前: "Eve",
				年齢: 28,
				住所: "Tokyo",
				郵便番号: "100-0003",
				職業: "Engineer",
			});
		});

		test("should apply skip with larger value", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				where: { 職業: "Engineer" },
				skip: 2,
			});

			// Should skip first two Engineers (Alice, Eve) and return the third one (Henry)
			expect(result).toEqual({
				名前: "Henry",
				年齢: 28,
				住所: "Kyoto",
				郵便番号: "600-8001",
				職業: "Engineer",
			});
		});

		test("should return null when skip exceeds available records", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				where: { 職業: "Engineer" },
				skip: 5,
			});

			expect(result).toBeNull();
		});

		test("should work with orderBy and skip", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				where: { 年齢: 28 },
				orderBy: { 名前: "desc" },
				skip: 1,
			});

			// Skip is applied first (skips Alice), then orderBy desc (Henry, Eve), returns Henry
			expect(result).toEqual({
				名前: "Henry",
				年齢: 28,
				住所: "Kyoto",
				郵便番号: "600-8001",
				職業: "Engineer",
			});
		});

		test("should work with select and skip", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				select: { 名前: true, 年齢: true },
				skip: 2,
			});

			// Should skip first 2 records and return the third with only selected fields
			expect(result).toEqual({
				名前: "Charlie",
				年齢: 22,
			});
		});

		test("should work with omit and skip", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				omit: { 郵便番号: true, 職業: true },
				skip: 1,
			});

			// Should skip first record and return second with omitted fields
			expect(result).toEqual({
				名前: "Bob",
				年齢: 35,
				住所: "Osaka",
			});
		});

		test("should throw error when both select and omit are provided", () => {
			expect(() => {
				findFirstFunc(getExtendedMockControllerUtil(), {
					select: { 名前: true },
					omit: { 年齢: true },
				});
			}).toThrow("Cannot use both select and omit in the same query");
		});

		test("should work with array orderBy", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				orderBy: [{ 年齢: "asc" }, { 名前: "desc" }],
				skip: 1,
			});

			// Skip first (Alice), then order remaining by age asc, return first of ordered results
			expect(result).toEqual({
				名前: "Charlie",
				年齢: 22,
				住所: "Tokyo",
				郵便番号: "100-0002",
				職業: "Student",
			});
		});

		test("should handle skip without providing it explicitly", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				where: { 職業: "Engineer" },
				// No skip property
			});

			// Should return first Engineer without skipping
			expect(result).toEqual({
				名前: "Alice",
				年齢: 28,
				住所: "Tokyo",
				郵便番号: "100-0001",
				職業: "Engineer",
			});
		});

		test("should handle skip: 0 (boundary value)", () => {
			const result = findFirstFunc(getExtendedMockControllerUtil(), {
				where: { 職業: "Engineer" },
				skip: 0,
			});

			// Should not skip any records, return first Engineer
			expect(result).toEqual({
				名前: "Alice",
				年齢: 28,
				住所: "Tokyo",
				郵便番号: "100-0001",
				職業: "Engineer",
			});
		});
	});
});
