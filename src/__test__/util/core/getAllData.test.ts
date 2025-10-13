import { getAllData } from "../../../util/core/getAllData";
import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";

describe("getAllData", () => {
  test("should return data with empty strings converted to null", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 3,
        getRange: (
          _row: number,
          _col: number,
          _numRows: number,
          _numCols: number,
        ) =>
          ({
            getValues: () => [
              ["John", 30, "Tokyo", ""],
              ["Jane", "", "Osaka", "550-0001"],
            ],
          }) as any,
      } as any,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 4,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([
      ["John", 30, "Tokyo", null],
      ["Jane", null, "Osaka", "550-0001"],
    ]);
  });

  test("should return empty array when rowLength is 0", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 1, // Only header row
        getRange: jest.fn(),
      } as any,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 4,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([]);
    expect(mockControllerUtil.sheet.getRange).not.toHaveBeenCalled();
  });

  test("should handle data without empty strings", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 3,
        getRange: (
          _row: number,
          _col: number,
          _numRows: number,
          _numCols: number,
        ) =>
          ({
            getValues: () => [
              ["John", 30, "Tokyo", "100-0001"],
              ["Jane", 25, "Osaka", "550-0001"],
            ],
          }) as any,
      } as any,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 4,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([
      ["John", 30, "Tokyo", "100-0001"],
      ["Jane", 25, "Osaka", "550-0001"],
    ]);
  });

  test("should handle single row of data", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 2,
        getRange: (
          _row: number,
          _col: number,
          _numRows: number,
          _numCols: number,
        ) =>
          ({
            getValues: () => [["John", 30, "", "100-0001"]],
          }) as any,
      } as any,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 4,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([["John", 30, null, "100-0001"]]);
  });

  test("should handle different start positions", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 5,
        getRange: (
          row: number,
          col: number,
          numRows: number,
          numCols: number,
        ) => {
          expect(row).toBe(3); // startRowNumber + 1
          expect(col).toBe(2); // startColumnNumber
          expect(numRows).toBe(3); // getLastRow() - startRowNumber
          expect(numCols).toBe(2); // endColumnNumber - startColumnNumber + 1
          return {
            getValues: () => [
              ["Data1", "Data2"],
              ["", "Data4"],
              ["Data5", ""],
            ],
          } as any;
        },
      } as any,
      startRowNumber: 2,
      startColumnNumber: 2,
      endColumnNumber: 3,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([
      ["Data1", "Data2"],
      [null, "Data4"],
      ["Data5", null],
    ]);
  });

  test("should handle mixed data types with empty strings", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 3,
        getRange: (
          _row: number,
          _col: number,
          _numRows: number,
          _numCols: number,
        ) =>
          ({
            getValues: () => [
              [123, true, new Date("2023-01-01"), ""],
              ["", false, "", 456],
            ],
          }) as any,
      } as any,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 4,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([
      [123, true, new Date("2023-01-01"), null],
      [null, false, null, 456],
    ]);
  });

  test("should handle all empty strings in a row", () => {
    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 3,
        getRange: (
          _row: number,
          _col: number,
          _numRows: number,
          _numCols: number,
        ) =>
          ({
            getValues: () => [
              ["", "", "", ""],
              ["Data", "", "", ""],
            ],
          }) as any,
      } as any,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 4,
    };

    const result = getAllData(mockControllerUtil);

    expect(result).toEqual([
      [null, null, null, null],
      ["Data", null, null, null],
    ]);
  });

  test("should correctly calculate range parameters", () => {
    const mockGetRange = jest.fn().mockReturnValue({
      getValues: () => [["test"]],
    });

    const mockControllerUtil: GassmaControllerUtil = {
      sheet: {
        getLastRow: () => 10,
        getRange: mockGetRange,
      } as any,
      startRowNumber: 3,
      startColumnNumber: 5,
      endColumnNumber: 8,
    };

    getAllData(mockControllerUtil);

    expect(mockGetRange).toHaveBeenCalledWith(
      4, // startRowNumber + 1
      5, // startColumnNumber
      7, // rowLength (10 - 3)
      4, // ColumnLength (8 - 5 + 1)
    );
  });
});
