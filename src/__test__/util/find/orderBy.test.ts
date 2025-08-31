import { findManyFunc } from "../../../util/find/findMany";
import { findFirstFunc } from "../../../util/find/findFirst";
import { extendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("orderBy functionality tests", () => {
  describe("findManyFunc with orderBy", () => {
    describe("single field sorting", () => {
      test("should sort by string field in ascending order", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: { 名前: "asc" }
        });

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

      test("should sort by string field in descending order", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: { 名前: "desc" }
        });

        expect(result).toEqual([
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" }
        ]);
      });

      test("should sort by numeric field in ascending order", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: { 年齢: "asc" }
        });

        expect(result).toEqual([
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" }
        ]);
      });

      test("should sort by numeric field in descending order", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: { 年齢: "desc" }
        });

        expect(result).toEqual([
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
        ]);
      });
    });

    describe("multiple field sorting", () => {
      test("should sort by multiple fields with array syntax", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: [
            { 年齢: "asc" },
            { 名前: "asc" }
          ]
        });

        expect(result).toEqual([
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" }
        ]);
      });

      test("should sort by multiple fields with mixed order", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: [
            { 住所: "asc" },
            { 年齢: "desc" }
          ]
        });

        expect(result).toEqual([
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
        ]);
      });

      test("should sort by three fields with complex ordering", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          orderBy: [
            { 職業: "asc" },
            { 年齢: "desc" },
            { 名前: "asc" }
          ]
        });

        expect(result).toEqual([
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
        ]);
      });
    });

    describe("orderBy with other options", () => {
      test("should work with where condition", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: { 住所: "Tokyo" },
          orderBy: { 年齢: "desc" }
        });

        expect(result).toEqual([
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
        ]);
      });

      test("should work with select", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          select: { 名前: true, 年齢: true },
          orderBy: { 年齢: "asc" }
        });

        expect(result).toEqual([
          { 名前: "Charlie", 年齢: 22 },
          { 名前: "Alice", 年齢: 28 },
          { 名前: "Eve", 年齢: 28 },
          { 名前: "Henry", 年齢: 28 },
          { 名前: "Grace", 年齢: 31 },
          { 名前: "Bob", 年齢: 35 },
          { 名前: "David", 年齢: 45 },
          { 名前: "Frank", 年齢: 52 }
        ]);
      });

      test("should work with where, select, and multiple orderBy", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: { 年齢: { gte: 28 } },
          select: { 名前: true, 年齢: true, 職業: true },
          orderBy: [
            { 年齢: "asc" },
            { 名前: "desc" }
          ]
        });

        expect(result).toEqual([
          { 名前: "Henry", 年齢: 28, 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 職業: "Engineer" },
          { 名前: "Alice", 年齢: 28, 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 職業: "Designer" },
          { 名前: "Bob", 年齢: 35, 職業: "Designer" },
          { 名前: "David", 年齢: 45, 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 職業: "Director" }
        ]);
      });
    });
  });

  describe("findFirstFunc with orderBy", () => {
    test("should return first result after sorting by ascending order", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        orderBy: { 年齢: "asc" }
      });

      expect(result).toEqual({
        名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student"
      });
    });

    test("should return first result after sorting by descending order", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        orderBy: { 年齢: "desc" }
      });

      expect(result).toEqual({
        名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director"
      });
    });

    test("should work with multiple orderBy fields", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        orderBy: [
          { 年齢: "asc" },
          { 名前: "desc" }
        ]
      });

      expect(result).toEqual({
        名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student"
      });
    });

    test("should work with where condition and orderBy", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: { 職業: "Engineer" },
        orderBy: { 名前: "desc" }
      });

      expect(result).toEqual({
        名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer"
      });
    });

    test("should work with select and orderBy", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        select: { 名前: true, 職業: true },
        orderBy: { 名前: "asc" }
      });

      expect(result).toEqual({
        名前: "Alice", 職業: "Engineer"
      });
    });

    test("should return null if no match found with orderBy", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: { 名前: "NonExistent" },
        orderBy: { 年齢: "asc" }
      });

      expect(result).toBeNull();
    });
  });
});