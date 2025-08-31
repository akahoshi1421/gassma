import { findManyFunc } from "../../../util/find/findMany";
import { findFirstFunc } from "../../../util/find/findFirst";
import { extendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("where functionality tests", () => {
  describe("findManyFunc with where", () => {
    describe("basic search", () => {
      test("should filter by single field - exact match", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: { 名前: "Alice" }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" }
        ]);
      });

      test("should filter by single field - number match", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: { 年齢: 28 }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
        ]);
      });
    });

    describe("multiple field search", () => {
      test("should filter by multiple fields (implicit AND)", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: { 年齢: 28, 住所: "Tokyo" }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" }
        ]);
      });

      test("should filter by multiple different field types", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: { 名前: "Bob", 職業: "Designer" }
        });

        expect(result).toEqual([
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" }
        ]);
      });
    });

    describe("AND, OR, NOT operations", () => {
      test("should handle explicit AND operation", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            AND: [
              { 職業: "Engineer" },
              { 住所: "Tokyo" }
            ]
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" }
        ]);
      });

      test("should handle OR operation", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            OR: [
              { 名前: "Alice" },
              { 名前: "Bob" }
            ]
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" }
        ]);
      });

      test("should handle NOT operation", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            NOT: { 住所: "Tokyo" }
          }
        });

        expect(result).toEqual([
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
        ]);
      });
    });

    describe("recursive nested operations", () => {
      test("should handle AND with nested NOT", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            AND: [
              { 職業: "Engineer" },
              { NOT: { 住所: "Kyoto" } }
            ]
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" }
        ]);
      });

      test("should handle OR with nested AND", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            OR: [
              {
                AND: [
                  { 職業: "Engineer" },
                  { 住所: "Tokyo" }
                ]
              },
              { 名前: "David" }
            ]
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" }
        ]);
      });

      test("should handle complex nested NOT with AND and OR", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            NOT: {
              OR: [
                { 住所: "Osaka" },
                {
                  AND: [
                    { 職業: "Engineer" },
                    { 年齢: 28 }
                  ]
                }
              ]
            }
          }
        });

        expect(result).toEqual([
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" }
        ]);
      });
    });

    describe("comparison operators", () => {
      test("should handle gte (greater than or equal)", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            年齢: { gte: 35 }
          }
        });

        expect(result).toEqual([
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" }
        ]);
      });

      test("should handle lte (less than or equal)", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            年齢: { lte: 28 }
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
        ]);
      });

      test("should handle gt (greater than)", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            年齢: { gt: 30 }
          }
        });

        expect(result).toEqual([
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" }
        ]);
      });

      test("should handle lt (less than)", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            年齢: { lt: 30 }
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
        ]);
      });

      test("should handle in operator", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            住所: { in: ["Tokyo", "Kyoto"] }
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" },
          { 名前: "Henry", 年齢: 28, 住所: "Kyoto", 郵便番号: "600-8001", 職業: "Engineer" }
        ]);
      });

      test("should handle notIn operator", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            職業: { notIn: ["Engineer", "Student"] }
          }
        });

        expect(result).toEqual([
          { 名前: "Bob", 年齢: 35, 住所: "Osaka", 郵便番号: "550-0001", 職業: "Designer" },
          { 名前: "David", 年齢: 45, 住所: "Kyoto", 郵便番号: "600-8000", 職業: "Manager" },
          { 名前: "Frank", 年齢: 52, 住所: "Osaka", 郵便番号: "550-0002", 職業: "Director" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" }
        ]);
      });
    });

    describe("string matching operators", () => {
      test("should handle contains operator", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            郵便番号: { contains: "100" }
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" }
        ]);
      });

      test("should handle startsWith operator", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            名前: { startsWith: "A" }
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" }
        ]);
      });

      test("should handle endsWith operator", () => {
        const result = findManyFunc(extendedMockControllerUtil, {
          where: {
            名前: { endsWith: "e" }
          }
        });

        expect(result).toEqual([
          { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" },
          { 名前: "Charlie", 年齢: 22, 住所: "Tokyo", 郵便番号: "100-0002", 職業: "Student" },
          { 名前: "Eve", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0003", 職業: "Engineer" },
          { 名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer" }
        ]);
      });
    });
  });

  describe("findFirstFunc with where", () => {
    test("should return first match with where condition", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: { 職業: "Engineer" }
      });

      expect(result).toEqual({
        名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer"
      });
    });

    test("should return null if no match found", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: { 名前: "NonExistent" }
      });

      expect(result).toBeNull();
    });

    test("should work with complex where conditions", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: {
          AND: [
            { 年齢: { gte: 30 } },
            { 住所: "Tokyo" }
          ]
        }
      });

      expect(result).toEqual({
        名前: "Grace", 年齢: 31, 住所: "Tokyo", 郵便番号: "100-0004", 職業: "Designer"
      });
    });
  });
});