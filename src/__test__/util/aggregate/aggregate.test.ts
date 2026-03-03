import { aggregateFunc } from "../../../util/aggregate/aggregate";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("aggregate functionality tests", () => {
  describe("aggregateFunc with single statistics", () => {
    test("should calculate _avg for a single field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _avg: { 年齢: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 35 + 22 + 45 + 28 + 52 + 31 + 28) / 8 },
      });
    });

    test("should calculate _max for a single field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _max: { 年齢: true },
      });

      expect(result).toEqual({
        _max: { 年齢: 52 },
      });
    });

    test("should calculate _min for a single field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _min: { 年齢: true },
      });

      expect(result).toEqual({
        _min: { 年齢: 22 },
      });
    });

    test("should calculate _sum for a single field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _sum: { 年齢: true },
      });

      expect(result).toEqual({
        _sum: { 年齢: 28 + 35 + 22 + 45 + 28 + 52 + 31 + 28 },
      });
    });

    test("should calculate _count for a single field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _count: { 年齢: true },
      });

      expect(result).toEqual({
        _count: { 年齢: 8 },
      });
    });
  });

  describe("aggregateFunc with multiple statistics", () => {
    test("should calculate multiple statistics for the same field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _avg: { 年齢: true },
        _max: { 年齢: true },
        _min: { 年齢: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 35 + 22 + 45 + 28 + 52 + 31 + 28) / 8 },
        _max: { 年齢: 52 },
        _min: { 年齢: 22 },
      });
    });

    test("should calculate statistics for multiple fields", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _avg: { 年齢: true },
        _count: { 名前: true, 住所: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 35 + 22 + 45 + 28 + 52 + 31 + 28) / 8 },
        _count: { 名前: 8, 住所: 8 },
      });
    });

    test("should calculate all statistics for a field", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        _avg: { 年齢: true },
        _count: { 年齢: true },
        _max: { 年齢: true },
        _min: { 年齢: true },
        _sum: { 年齢: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 35 + 22 + 45 + 28 + 52 + 31 + 28) / 8 },
        _count: { 年齢: 8 },
        _max: { 年齢: 52 },
        _min: { 年齢: 22 },
        _sum: { 年齢: 28 + 35 + 22 + 45 + 28 + 52 + 31 + 28 },
      });
    });
  });

  describe("aggregateFunc with where conditions", () => {
    test("should work with simple where condition", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: { 住所: "Tokyo" },
        _avg: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 22 + 28 + 31) / 4 },
        _count: { 名前: 4 },
      });
    });

    test("should work with complex where condition", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: { 年齢: { gte: 30 } },
        _max: { 年齢: true },
        _min: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _max: { 年齢: 52 },
        _min: { 年齢: 31 },
        _count: { 名前: 4 },
      });
    });

    test("should work with AND conditions", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: {
          住所: "Tokyo",
          年齢: { gte: 25 },
        },
        _avg: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 28 + 31) / 3 },
        _count: { 名前: 3 },
      });
    });
  });

  describe("aggregateFunc with orderBy", () => {
    test("should work with orderBy (though it doesn't affect aggregation results)", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        orderBy: { 年齢: "desc" },
        _avg: { 年齢: true },
        _max: { 年齢: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 35 + 22 + 45 + 28 + 52 + 31 + 28) / 8 },
        _max: { 年齢: 52 },
      });
    });
  });

  describe("aggregateFunc with skip and take", () => {
    test("should work with skip", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        skip: 3,
        _count: { 名前: true },
        _avg: { 年齢: true },
      });

      expect(result).toEqual({
        _count: { 名前: 5 },
        _avg: { 年齢: (45 + 28 + 52 + 31 + 28) / 5 },
      });
    });

    test("should work with take", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        take: 3,
        _count: { 名前: true },
        _sum: { 年齢: true },
      });

      expect(result).toEqual({
        _count: { 名前: 3 },
        _sum: { 年齢: 28 + 35 + 22 },
      });
    });

    test("should work with skip and take combined", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        skip: 2,
        take: 3,
        _avg: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (22 + 45 + 28) / 3 },
        _count: { 名前: 3 },
      });
    });
  });

  describe("aggregateFunc with all parameters", () => {
    test("should work with all parameters combined", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: { 年齢: { gte: 25 } },
        orderBy: { 年齢: "asc" },
        skip: 1,
        take: 4,
        _avg: { 年齢: true },
        _max: { 年齢: true },
        _min: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 28 + 31 + 35) / 4 },
        _max: { 年齢: 35 },
        _min: { 年齢: 28 },
        _count: { 名前: 4 },
      });
    });
  });

  describe("aggregateFunc edge cases", () => {
    test("should handle no matching records", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: { 名前: "NonExistent" },
        _avg: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: null },
        _count: { 名前: null },
      });
    });

    test("should handle take=0", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        take: 0,
        _avg: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: null },
        _count: { 名前: null },
      });
    });

    test("should handle skip exceeding total records", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        skip: 20,
        _sum: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _sum: { 年齢: null },
        _count: { 名前: null },
      });
    });

    test("should handle negative skip gracefully", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        skip: -1,
        _avg: { 年齢: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 35 + 22 + 45 + 28 + 52 + 31 + 28) / 8 },
      });
    });
  });

  describe("aggregateFunc with specific field filtering", () => {
    test("should work with Engineer filtering", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: { 職業: "Engineer" },
        _avg: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _avg: { 年齢: (28 + 28 + 28) / 3 },
        _count: { 名前: 3 },
      });
    });

    test("should work with age range filtering", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: {
          年齢: {
            gte: 25,
            lte: 35,
          },
        },
        _max: { 年齢: true },
        _min: { 年齢: true },
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _max: { 年齢: 35 },
        _min: { 年齢: 28 },
        _count: { 名前: 5 },
      });
    });
  });

  describe("aggregateFunc with undefined where", () => {
    test("should not throw when where is undefined", () => {
      const result = aggregateFunc(getExtendedMockControllerUtil(), {
        where: undefined,
        _count: { 名前: true },
      });

      expect(result).toEqual({
        _count: { 名前: 8 },
      });
    });
  });
});
