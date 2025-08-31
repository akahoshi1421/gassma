import { findManyFunc } from "../../../util/find/findMany";
import { findFirstFunc } from "../../../util/find/findFirst";
import { extendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("select functionality tests", () => {
  describe("findManyFunc with select", () => {
    test("should select single field", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        select: { 名前: true }
      });

      expect(result).toEqual([
        { 名前: "Alice" },
        { 名前: "Bob" },
        { 名前: "Charlie" },
        { 名前: "David" },
        { 名前: "Eve" },
        { 名前: "Frank" },
        { 名前: "Grace" },
        { 名前: "Henry" }
      ]);
    });

    test("should select multiple fields", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        select: { 名前: true, 年齢: true }
      });

      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28 },
        { 名前: "Bob", 年齢: 35 },
        { 名前: "Charlie", 年齢: 22 },
        { 名前: "David", 年齢: 45 },
        { 名前: "Eve", 年齢: 28 },
        { 名前: "Frank", 年齢: 52 },
        { 名前: "Grace", 年齢: 31 },
        { 名前: "Henry", 年齢: 28 }
      ]);
    });

    test("should select specific fields with where condition", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 住所: "Tokyo" },
        select: { 名前: true, 職業: true }
      });

      expect(result).toEqual([
        { 名前: "Alice", 職業: "Engineer" },
        { 名前: "Charlie", 職業: "Student" },
        { 名前: "Eve", 職業: "Engineer" },
        { 名前: "Grace", 職業: "Designer" }
      ]);
    });

    test("should select all available fields", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 名前: "Alice" },
        select: { 名前: true, 年齢: true, 住所: true, 郵便番号: true, 職業: true }
      });

      expect(result).toEqual([
        { 名前: "Alice", 年齢: 28, 住所: "Tokyo", 郵便番号: "100-0001", 職業: "Engineer" }
      ]);
    });

    test("should work with complex where and select combination", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: {
          OR: [
            { 職業: "Engineer" },
            { 職業: "Designer" }
          ]
        },
        select: { 名前: true, 職業: true, 住所: true }
      });

      expect(result).toEqual([
        { 名前: "Alice", 職業: "Engineer", 住所: "Tokyo" },
        { 名前: "Bob", 職業: "Designer", 住所: "Osaka" },
        { 名前: "Eve", 職業: "Engineer", 住所: "Tokyo" },
        { 名前: "Grace", 職業: "Designer", 住所: "Tokyo" },
        { 名前: "Henry", 職業: "Engineer", 住所: "Kyoto" }
      ]);
    });

    test("should handle empty result with select", () => {
      const result = findManyFunc(extendedMockControllerUtil, {
        where: { 名前: "NonExistent" },
        select: { 名前: true, 年齢: true }
      });

      expect(result).toEqual([]);
    });
  });

  describe("findFirstFunc with select", () => {
    test("should select single field for first result", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        select: { 名前: true }
      });

      expect(result).toEqual({
        名前: "Alice"
      });
    });

    test("should select multiple fields for first result", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        select: { 名前: true, 年齢: true, 職業: true }
      });

      expect(result).toEqual({
        名前: "Alice", 年齢: 28, 職業: "Engineer"
      });
    });

    test("should select with where condition", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: { 職業: "Designer" },
        select: { 名前: true, 住所: true }
      });

      expect(result).toEqual({
        名前: "Bob", 住所: "Osaka"
      });
    });

    test("should return null when no match found with select", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: { 名前: "NonExistent" },
        select: { 名前: true }
      });

      expect(result).toBeNull();
    });

    test("should work with complex where condition and select", () => {
      const result = findFirstFunc(extendedMockControllerUtil, {
        where: {
          AND: [
            { 年齢: { gte: 30 } },
            { 住所: "Tokyo" }
          ]
        },
        select: { 名前: true, 年齢: true }
      });

      expect(result).toEqual({
        名前: "Grace", 年齢: 31
      });
    });
  });

  describe("select error handling", () => {
    test("should throw error when both select and omit are used in findMany", () => {
      expect(() => {
        findManyFunc(extendedMockControllerUtil, {
          select: { 名前: true },
          omit: { 年齢: true }
        });
      }).toThrow("Cannot use both select and omit in the same query");
    });

    test("should throw error when both select and omit are used in findFirst", () => {
      expect(() => {
        findFirstFunc(extendedMockControllerUtil, {
          select: { 名前: true },
          omit: { 年齢: true }
        });
      }).toThrow("Cannot use both select and omit in the same query");
    });
  });
});