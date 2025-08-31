import { findManyFunc } from "../../../util/find/findMany";
import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";

describe("distinct functionality tests", () => {
  // Mock with duplicate data for distinct testing
  const distinctMockControllerUtil: GassmaControllerUtil = {
    sheet: {
      getDataRange: () => ({
        getValues: () => [
          ["名前", "年齢", "住所", "郵便番号", "職業"],
          ["Alice", 28, "Tokyo", "100-0001", "Engineer"],
          ["Bob", 35, "Osaka", "550-0001", "Designer"],
          ["Alice", 28, "Tokyo", "100-0001", "Engineer"], // Duplicate of Alice
          ["Charlie", 22, "Tokyo", "100-0002", "Student"],
          ["David", 35, "Kyoto", "600-8000", "Manager"], // Same age as Bob
          ["Eve", 28, "Tokyo", "100-0003", "Engineer"], // Same age and city as Alice
          ["Alice", 28, "Tokyo", "100-0001", "Engineer"], // Another duplicate of Alice
          ["Frank", 35, "Osaka", "550-0002", "Director"] // Same age and city as Bob
        ]
      }) as any,
      getLastRow: () => 9,
      getLastColumn: () => 5,
      getRange: (row: number, col: number, numRows: number, numCols: number) => {
        if (row === 1 && numRows === 1) {
          return {
            getValues: () => [["名前", "年齢", "住所", "郵便番号", "職業"]]
          } as any;
        } else {
          return {
            getValues: () => [
              ["Alice", 28, "Tokyo", "100-0001", "Engineer"],
              ["Bob", 35, "Osaka", "550-0001", "Designer"],
              ["Alice", 28, "Tokyo", "100-0001", "Engineer"],
              ["Charlie", 22, "Tokyo", "100-0002", "Student"],
              ["David", 35, "Kyoto", "600-8000", "Manager"],
              ["Eve", 28, "Tokyo", "100-0003", "Engineer"],
              ["Alice", 28, "Tokyo", "100-0001", "Engineer"],
              ["Frank", 35, "Osaka", "550-0002", "Director"]
            ]
          } as any;
        }
      }
    } as any,
    startRowNumber: 1,
    startColumnNumber: 1,
    endColumnNumber: 5
  };

  describe("findManyFunc with distinct", () => {
    test("should return distinct records by name field", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        distinct: ["名前"]
      });

      expect(result).toHaveLength(6); // Alice, Bob, Charlie, David, Eve, Frank (unique names)
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "David", 年齢: 35, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Frank", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" }
      ]);
    });

    test("should return distinct records by age field", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        distinct: ["年齢"]
      });

      expect(result).toHaveLength(3); // 3 unique ages: 28, 35, 22
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
      ]);
    });

    test("should work with select and distinct", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        select: { 年齢: true },
        distinct: ["年齢"]
      });

      expect(result).toHaveLength(3); // 3 unique ages
      expect(result).toEqual([
        { 年齢: 28 },
        { 年齢: 35 },
        { 年齢: 22 }
      ]);
    });

    test("should work with where condition", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        where: { 住所: "Tokyo" },
        distinct: ["年齢"]
      });

      expect(result).toHaveLength(2); // 2 unique ages in Tokyo: 28, 22
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
      ]);
    });

    test("should work with orderBy", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        distinct: ["年齢"],
        orderBy: { 年齢: "asc" }
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" }
      ]);
    });

    test("should work with multiple distinct fields", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        distinct: ["年齢", "住所"]
      });

      expect(result).toHaveLength(4); // Unique combinations of age and location
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "David", 年齢: 35, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" }
      ]);
    });

    test("should return empty array when no records match", () => {
      const result = findManyFunc(distinctMockControllerUtil, {
        where: { 名前: "NonExistent" },
        distinct: ["名前"]
      });

      expect(result).toEqual([]);
    });
  });
});