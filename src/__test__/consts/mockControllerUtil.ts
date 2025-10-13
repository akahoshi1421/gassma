import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

// Function to get basic mock for simple tests (prevents destructive changes)
export const getBasicMockControllerUtil = (): GassmaControllerUtil => ({
	sheet: {
		getDataRange: () =>
			({
				getValues: () => [
					["名前", "年齢", "住所", "郵便番号"],
					["John", 30, "Tokyo", "100-0001"],
					["Jane", 25, "Osaka", "550-0001"],
				],
			}) as any,
		getLastRow: () => 3,
		getLastColumn: () => 4,
		getRange: (row: number, col: number, numRows: number, numCols: number) => {
			if (row === 1 && numRows === 1) {
				// Title row request
				return {
					getValues: () => [["名前", "年齢", "住所", "郵便番号"]],
				} as any;
			} else {
				// Data rows request
				return {
					getValues: () => [
						["John", 30, "Tokyo", "100-0001"],
						["Jane", 25, "Osaka", "550-0001"],
					],
				} as any;
			}
		},
	} as any,
	startRowNumber: 1,
	startColumnNumber: 1,
	endColumnNumber: 4,
});

// For backward compatibility
export const basicMockControllerUtil = getBasicMockControllerUtil();

// Function to get extended mock with more comprehensive test data (prevents destructive changes)
export const getExtendedMockControllerUtil = (): GassmaControllerUtil => ({
	sheet: {
		getDataRange: () =>
			({
				getValues: () => [
					["名前", "年齢", "住所", "郵便番号", "職業"],
					["Alice", 28, "Tokyo", "100-0001", "Engineer"],
					["Bob", 35, "Osaka", "550-0001", "Designer"],
					["Charlie", 22, "Tokyo", "100-0002", "Student"],
					["David", 45, "Kyoto", "600-8000", "Manager"],
					["Eve", 28, "Tokyo", "100-0003", "Engineer"],
					["Frank", 52, "Osaka", "550-0002", "Director"],
					["Grace", 31, "Tokyo", "100-0004", "Designer"],
					["Henry", 28, "Kyoto", "600-8001", "Engineer"],
				],
			}) as any,
		getLastRow: () => 9,
		getLastColumn: () => 5,
		getRange: (row: number, col: number, numRows: number, numCols: number) => {
			if (row === 1 && numRows === 1) {
				// Title row request
				return {
					getValues: () => [["名前", "年齢", "住所", "郵便番号", "職業"]],
				} as any;
			} else {
				// Data rows request
				return {
					getValues: () => [
						["Alice", 28, "Tokyo", "100-0001", "Engineer"],
						["Bob", 35, "Osaka", "550-0001", "Designer"],
						["Charlie", 22, "Tokyo", "100-0002", "Student"],
						["David", 45, "Kyoto", "600-8000", "Manager"],
						["Eve", 28, "Tokyo", "100-0003", "Engineer"],
						["Frank", 52, "Osaka", "550-0002", "Director"],
						["Grace", 31, "Tokyo", "100-0004", "Designer"],
						["Henry", 28, "Kyoto", "600-8001", "Engineer"],
					],
				} as any;
			}
		},
	} as any,
	startRowNumber: 1,
	startColumnNumber: 1,
	endColumnNumber: 5,
});

// For backward compatibility
export const extendedMockControllerUtil = getExtendedMockControllerUtil();

// Type definition for extended mock sheet with helper methods
interface MockSheetWithHelpers extends GoogleAppsScript.Spreadsheet.Sheet {
	_getMockData: () => any[][];
	_resetMockData: () => void;
}

// Type definition for mutable mock controller util
interface MutableGassmaControllerUtil extends GassmaControllerUtil {
	sheet: MockSheetWithHelpers;
}

// Function to get mutable mock for create/update/delete tests (maintains state)
export const getMutableMockControllerUtil = (): MutableGassmaControllerUtil => {
	let mockData = [
		["名前", "年齢", "住所", "郵便番号", "職業"],
		["Alice", 28, "Tokyo", "100-0001", "Engineer"],
		["Bob", 35, "Osaka", "550-0001", "Designer"],
		["Charlie", 22, "Tokyo", "100-0002", "Student"],
		["David", 45, "Kyoto", "600-8000", "Manager"],
		["Eve", 28, "Tokyo", "100-0003", "Engineer"],
		["Frank", 52, "Osaka", "550-0002", "Director"],
		["Grace", 31, "Tokyo", "100-0004", "Designer"],
		["Henry", 28, "Kyoto", "600-8001", "Engineer"],
	];

	return {
		sheet: {
			getDataRange: jest.fn(() => ({
				getValues: jest.fn(() => [...mockData]),
			})),
			getLastRow: jest.fn(() => mockData.length),
			getLastColumn: jest.fn(() => 5),
			getRange: jest.fn(
				(row: number, col: number, numRows: number, numCols: number) => {
					if (row === 1 && numRows === 1) {
						// Title row request
						return {
							getValues: jest.fn(() => [mockData[0]]),
							setValues: jest.fn((values: any[][]) => {
								values.forEach((rowValues, i) => {
									rowValues.forEach((value, j) => {
										if (mockData[row - 1 + i]) {
											mockData[row - 1 + i][col - 1 + j] = value;
										}
									});
								});
							}),
						} as any;
					} else {
						// Data manipulation
						return {
							getValues: jest.fn(() => {
								const result = [];
								for (let i = 0; i < numRows; i++) {
									if (mockData[row - 1 + i]) {
										const rowData = [];
										for (let j = 0; j < numCols; j++) {
											rowData.push(mockData[row - 1 + i][col - 1 + j]);
										}
										result.push(rowData);
									}
								}
								return result;
							}),
							setValues: jest.fn((values: any[][]) => {
								values.forEach((rowValues, i) => {
									// Ensure the row exists in mockData
									while (mockData.length <= row - 1 + i) {
										mockData.push(Array(5).fill(""));
									}
									rowValues.forEach((value, j) => {
										mockData[row - 1 + i][col - 1 + j] = value;
									});
								});
							}),
						} as any;
					}
				},
			),
			insertRow: jest.fn((rowIndex: number) => {
				mockData.splice(rowIndex - 1, 0, Array(5).fill(""));
			}),
			deleteRow: jest.fn((rowIndex: number) => {
				mockData.splice(rowIndex - 1, 1);
			}),
			// Helper method to get current mock data state
			_getMockData: () => [...mockData],
			// Helper method to reset mock data
			_resetMockData: () => {
				mockData = [
					["名前", "年齢", "住所", "郵便番号", "職業"],
					["Alice", 28, "Tokyo", "100-0001", "Engineer"],
					["Bob", 35, "Osaka", "550-0001", "Designer"],
					["Charlie", 22, "Tokyo", "100-0002", "Student"],
					["David", 45, "Kyoto", "600-8000", "Manager"],
					["Eve", 28, "Tokyo", "100-0003", "Engineer"],
					["Frank", 52, "Osaka", "550-0002", "Director"],
					["Grace", 31, "Tokyo", "100-0004", "Designer"],
					["Henry", 28, "Kyoto", "600-8001", "Engineer"],
				];
			},
		} as any,
		startRowNumber: 1,
		startColumnNumber: 1,
		endColumnNumber: 5,
	};
};
