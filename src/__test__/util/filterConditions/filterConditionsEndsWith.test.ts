import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("filterConditionsEndsWith", () => {
	test("should return true for matching suffix", () => {
		const cellData = "test";
		const filterOptions = { endsWith: "st" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
	});
	test("should return false for non-matching suffix", () => {
		const cellData = "test";
		const filterOptions = { endsWith: "not" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
	});
	test("should return false for non-matching suffix2", () => {
		const cellData = "test";
		const filterOptions = { endsWith: "te" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
	});

	test("should return false when cellData is null", () => {
		const cellData = null;
		const filterOptions = { endsWith: "test" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(false);
	});

	test("should handle numeric values converted to string", () => {
		const cellData = 123;
		const filterOptions = { endsWith: "3" };
		expect(isFilterConditionsMatch(cellData, filterOptions)).toBe(true);
	});
});
