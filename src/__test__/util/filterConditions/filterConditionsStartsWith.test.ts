import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsStartsWith", () => {
	test("should return true for matching prefix", () => {
		const cellData = "test";
		const filterOptions = { startsWith: "te" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
	});
	test("should return false for non-matching prefix", () => {
		const cellData = "test";
		const filterOptions = { startsWith: "not" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
	});
	test("should return false for non-matching prefix2", () => {
		const cellData = "test";
		const filterOptions = { startsWith: "st" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
	});

	test("should return false when cellData is null", () => {
		const cellData = null;
		const filterOptions = { startsWith: "test" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
	});

	test("should handle numeric values converted to string", () => {
		const cellData = 123;
		const filterOptions = { startsWith: "1" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
	});
});
