import { findManyFunc } from "../../../util/find/findMany";
import { extendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("take functionality tests", () => {
  describe("findManyFunc with take", () => {
    test("should limit results to specified number", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        take: 3
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
      ]);
    });

    test("should take one record", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        take: 1
      });

      expect(result).toHaveLength(1);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" }
      ]);
    });

    test("should take all records when take exceeds total count", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        take: 100
      });

      expect(result).toHaveLength(8); // Total number of records in extendedMockControllerUtil
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
        { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
      ]);
    });

    test("should work with where condition", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 住所: "Tokyo" },
        take: 2
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
      ]);
    });

    test("should work with select", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        select: { 名前: true, 年齢: true },
        take: 3
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28 },
        { 名前: "Bob", 年齢: 35 },
        { 名前: "Charlie", 年齢: 22 }
      ]);
    });

    test("should work with orderBy", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        orderBy: { 年齢: "desc" },
        take: 3
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
        { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" }
      ]);
    });

    test("should work with complex combination of options", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 職業: "Engineer" },
        select: { 名前: true, 年齢: true, 住所: true },
        orderBy: { 年齢: "asc" },
        take: 2
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo" }
      ]);
    });

    test("should return empty array when filtered results are empty", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 名前: "NonExistent" },
        take: 5
      });

      expect(result).toEqual([]);
    });

    test("should take from filtered results", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 年齢: 28 },
        take: 2
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" }
      ]);
    });

    test("should handle take with value of zero", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        take: 0
      });

      expect(result).toEqual([]);
    });

    test("should work with omit", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        omit: { 郵便番号: true, 職業: true },
        take: 2
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka" }
      ]);
    });
  });

  describe("findManyFunc take edge cases", () => {
    test("should handle negative take values gracefully", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        take: -1
      });

      expect(result).toHaveLength(8); // Negative take should return all records
    });

    test("should work with floating point take values", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        take: 2.7
      });

      expect(result).toHaveLength(2);
    });
  });
});