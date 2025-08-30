import { findManyFunc } from "../../../util/find/findMany";
import { findFirstFunc } from "../../../util/find/findFirst";
import { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";

describe("omit integration tests", () => {
  const mockControllerUtil: GassmaControllerUtil = {
    sheet: {
      getDataRange: () => ({
        getValues: () => [
          ["名前", "年齢", "住所", "郵便番号"],
          ["John", 30, "Tokyo", "100-0001"],
          ["Jane", 25, "Osaka", "550-0001"]
        ]
      }) as any,
      getLastRow: () => 3,
      getLastColumn: () => 4,
      getRange: (row: number, col: number, numRows: number, numCols: number) => {
        if (row === 1 && numRows === 1) {
          // Title row request
          return {
            getValues: () => [["名前", "年齢", "住所", "郵便番号"]]
          } as any;
        } else {
          // Data rows request
          return {
            getValues: () => [
              ["John", 30, "Tokyo", "100-0001"],
              ["Jane", 25, "Osaka", "550-0001"]
            ]
          } as any;
        }
      }
    } as any,
    startRowNumber: 1,
    startColumnNumber: 1,
    endColumnNumber: 4
  };

  describe("findManyFunc with omit", () => {
    test("should omit specified fields", () => {
      const result = findManyFunc(mockControllerUtil, {
        omit: { 郵便番号: true }
      });

      expect(result).toEqual([
        { 名前: "John", 年齢: 30, 住所: "Tokyo" },
        { 名前: "Jane", 年齢: 25, 住所: "Osaka" }
      ]);
    });

    test("should omit multiple fields", () => {
      const result = findManyFunc(mockControllerUtil, {
        omit: { 住所: true, 郵便番号: true }
      });

      expect(result).toEqual([
        { 名前: "John", 年齢: 30 },
        { 名前: "Jane", 年齢: 25 }
      ]);
    });

    test("should throw error when both select and omit are used", () => {
      expect(() => {
        findManyFunc(mockControllerUtil, {
          select: { 名前: true },
          omit: { 住所: true }
        });
      }).toThrow("Cannot use both select and omit in the same query");
    });
  });

  describe("findFirstFunc with omit", () => {
    test("should omit specified fields", () => {
      const result = findFirstFunc(mockControllerUtil, {
        omit: { 郵便番号: true }
      });

      expect(result).toEqual({
        名前: "John",
        年齢: 30,
        住所: "Tokyo"
      });
    });

    test("should omit multiple fields", () => {
      const result = findFirstFunc(mockControllerUtil, {
        omit: { 住所: true, 郵便番号: true }
      });

      expect(result).toEqual({
        名前: "John",
        年齢: 30
      });
    });

    test("should throw error when both select and omit are used", () => {
      expect(() => {
        findFirstFunc(mockControllerUtil, {
          select: { 名前: true },
          omit: { 住所: true }
        });
      }).toThrow("Cannot use both select and omit in the same query");
    });
  });
});