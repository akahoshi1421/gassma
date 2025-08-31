import { findManyFunc } from "../../../util/find/findMany";
import { extendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("skip functionality tests", () => {
  describe("findManyFunc with skip", () => {
    test("should skip specified number of records", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: 2
      });

      expect(result).toHaveLength(6); // 8 total - 2 skipped = 6
      expect(result).toEqual([
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
        { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
      ]);
    });

    test("should skip no records when skip is 0", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: 0
      });

      expect(result).toHaveLength(8); // All records
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

    test("should return empty array when skip exceeds total count", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: 20
      });

      expect(result).toEqual([]);
    });

    test("should skip all but one record", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: 7
      });

      expect(result).toHaveLength(1);
      expect(result).toEqual([
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
      ]);
    });

    test("should work with where condition", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 住所: "Tokyo" },
        skip: 1
      });

      expect(result).toHaveLength(3); // 4 Tokyo records - 1 skipped = 3
      expect(result).toEqual([
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" }
      ]);
    });

    test("should work with select", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        select: { 名前: true, 年齢: true },
        skip: 3
      });

      expect(result).toHaveLength(5);
      expect(result).toEqual([
        { 名前: "David", 年齢: 45 },
        { 名前: "Eve", 年齢: 28 },
        { 名前: "Frank", 年齢: 52 },
        { 名前: "Grace", 年齢: 31 },
        { 名前: "Henry", 年齢: 28 }
      ]);
    });

    test("should work with orderBy", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        orderBy: { 年齢: "asc" },
        skip: 2
      });

      expect(result).toHaveLength(6);
      expect(result).toEqual([
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" },
        { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" }
      ]);
    });

    test("should work with take (pagination)", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: 2,
        take: 3
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
        { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" }
      ]);
    });

    test("should work with complex combination of options", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 年齢: { gte: 28 } },
        select: { 名前: true, 年齢: true, 職業: true },
        orderBy: { 年齢: "desc" },
        skip: 1,
        take: 3
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "David", 年齢: 45, 職業: "Manager" },
        { 名前: "Bob", 年齢: 35, 職業: "Designer" },
        { 名前: "Grace", 年齢: 31, 職業: "Designer" }
      ]);
    });

    test("should work with omit", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        omit: { 郵便番号: true, 職業: true },
        skip: 5
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Frank", 年齢: 52, 住所: "Osaka" },
        { 名前: "Grace", 年齢: 31, 住所: "Tokyo" },
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto" }
      ]);
    });

    test("should return empty array when filtered results are empty", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 名前: "NonExistent" },
        skip: 1
      });

      expect(result).toEqual([]);
    });

    test("should skip within filtered results", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 年齢: 28 },
        skip: 1
      });

      expect(result).toHaveLength(2); // 3 records with age 28 - 1 skipped = 2
      expect(result).toEqual([
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
      ]);
    });
  });

  describe("findManyFunc skip edge cases", () => {
    test("should handle negative skip values gracefully", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: -1
      });

      expect(result).toHaveLength(8); // Should skip 0 records (treat negative as no skip)
    });

    test("should handle floating point skip values", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: 2.7
      });

      expect(result).toHaveLength(6); // Should skip 2 records (floor the value)
    });
  });

  describe("pagination scenarios", () => {
    test("should implement basic pagination - page 1", () => {
      const pageSize = 3;
      const page = 1;
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
        { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
        { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" }
      ]);
    });

    test("should implement basic pagination - page 2", () => {
      const pageSize = 3;
      const page = 2;
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
        { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
        { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" }
      ]);
    });

    test("should implement basic pagination - last page", () => {
      const pageSize = 3;
      const page = 3;
      const result = findManyFunc(extendedMockControllerUtil, {
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      expect(result).toHaveLength(2); // Only 2 records left
      expect(result).toEqual([
        { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
        { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
      ]);
    });
  });
});