import { notPatternFilter } from "../../../../../../util/groupby/groubyUtil/having/normalHavingFilter/notPatternFilter";
import type {
  HitByClassificationedRowData,
  HavingUse,
} from "../../../../../../types/coreTypes";

describe("notPatternFilter function tests", () => {
  // Mock data setup
  const mockClassificationedRows: HitByClassificationedRowData[] = [
    {
      row: [
        { age: 25, name: "Alice", city: "Tokyo", score: 85, category: "A" },
      ],
      rowNumber: 1,
    },
    {
      row: [{ age: 30, name: "Bob", city: "Osaka", score: 92, category: "B" }],
      rowNumber: 2,
    },
    {
      row: [
        { age: 22, name: "Charlie", city: "Tokyo", score: 78, category: "A" },
      ],
      rowNumber: 3,
    },
    {
      row: [
        { age: 35, name: "David", city: "Kyoto", score: 88, category: "C" },
      ],
      rowNumber: 4,
    },
    {
      row: [{ age: 28, name: "Eve", city: "Tokyo", score: 95, category: "A" }],
      rowNumber: 5,
    },
  ];

  const byFields = ["age", "name", "city", "score", "category"];

  describe("equals condition filtering", () => {
    test("should filter by direct equals value", () => {
      const havingData: HavingUse = {
        city: "Tokyo",
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });

    test("should filter by explicit equals condition", () => {
      const havingData: HavingUse = {
        age: { equals: 30 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(1);
      expect(result[0].row[0].name).toBe("Bob");
    });

    test("should filter by multiple equals conditions", () => {
      const havingData: HavingUse = {
        city: "Tokyo",
        category: "A",
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });
  });

  describe("not condition filtering", () => {
    test("should filter by not condition", () => {
      const havingData: HavingUse = {
        city: { not: "Tokyo" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "David"]);
    });

    test("should filter by not condition with number", () => {
      const havingData: HavingUse = {
        age: { not: 25 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Bob",
        "Charlie",
        "David",
        "Eve",
      ]);
    });
  });

  describe("in condition filtering", () => {
    test("should filter by in condition with array", () => {
      const havingData: HavingUse = {
        city: { in: ["Tokyo", "Osaka"] },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "Eve",
      ]);
    });

    test("should filter by in condition with numbers", () => {
      const havingData: HavingUse = {
        age: { in: [25, 30, 35] },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Bob",
        "David",
      ]);
    });
  });

  describe("notIn condition filtering", () => {
    test("should filter by notIn condition", () => {
      const havingData: HavingUse = {
        city: { notIn: ["Tokyo"] },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "David"]);
    });

    test("should filter by notIn condition with multiple values", () => {
      const havingData: HavingUse = {
        category: { notIn: ["A", "B"] },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(1);
      expect(result[0].row[0].name).toBe("David");
    });
  });

  describe("lt condition filtering", () => {
    test("should filter by lt condition", () => {
      const havingData: HavingUse = {
        age: { lt: 30 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });

    test("should filter by lt condition with score", () => {
      const havingData: HavingUse = {
        score: { lt: 90 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "David",
      ]);
    });
  });

  describe("lte condition filtering", () => {
    test("should filter by lte condition", () => {
      const havingData: HavingUse = {
        age: { lte: 28 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });

    test("should filter by lte condition equal value", () => {
      const havingData: HavingUse = {
        score: { lte: 88 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "David",
      ]);
    });
  });

  describe("gt condition filtering", () => {
    test("should filter by gt condition", () => {
      const havingData: HavingUse = {
        age: { gt: 25 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "David", "Eve"]);
    });

    test("should filter by gt condition with score", () => {
      const havingData: HavingUse = {
        score: { gt: 90 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "Eve"]);
    });
  });

  describe("gte condition filtering", () => {
    test("should filter by gte condition", () => {
      const havingData: HavingUse = {
        age: { gte: 30 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "David"]);
    });

    test("should filter by gte condition with equal value", () => {
      const havingData: HavingUse = {
        score: { gte: 88 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "David", "Eve"]);
    });
  });

  describe("contains condition filtering", () => {
    test("should filter by contains condition", () => {
      const havingData: HavingUse = {
        name: { contains: "a" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Charlie", "David"]);
    });

    test("should filter by contains condition case sensitive", () => {
      const havingData: HavingUse = {
        city: { contains: "o" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "David",
        "Eve",
      ]);
    });
  });

  describe("startsWith condition filtering", () => {
    test("should filter by startsWith condition", () => {
      const havingData: HavingUse = {
        name: { startsWith: "A" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(1);
      expect(result[0].row[0].name).toBe("Alice");
    });

    test("should filter by startsWith condition with city", () => {
      const havingData: HavingUse = {
        city: { startsWith: "T" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });
  });

  describe("endsWith condition filtering", () => {
    test("should filter by endsWith condition", () => {
      const havingData: HavingUse = {
        name: { endsWith: "e" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });

    test("should filter by endsWith condition with city", () => {
      const havingData: HavingUse = {
        city: { endsWith: "o" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "David",
        "Eve",
      ]);
    });
  });

  describe("multiple conditions filtering", () => {
    test("should filter by multiple different conditions", () => {
      const havingData: HavingUse = {
        age: { gte: 25 },
        city: { in: ["Tokyo", "Osaka"] },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Bob", "Eve"]);
    });

    test("should filter by complex multiple conditions", () => {
      const havingData: HavingUse = {
        age: { lt: 35 },
        score: { gte: 85 },
        category: { not: "C" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Bob", "Eve"]);
    });

    test("should filter by mixed condition types on same field", () => {
      const havingData: HavingUse = {
        age: { gte: 25, lte: 30 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Bob", "Eve"]);
    });
  });

  describe("edge cases and error handling", () => {
    test("should handle empty having data", () => {
      const havingData: HavingUse = {};

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(5);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "David",
        "Eve",
      ]);
    });

    test("should handle AND/OR/NOT keywords (should be ignored)", () => {
      const havingData: HavingUse = {
        AND: [{ age: 25 }],
        OR: [{ city: "Tokyo" }],
        NOT: [{ category: "A" }],
        city: "Tokyo",
      } as any;

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Charlie",
        "Eve",
      ]);
    });

    test("should throw error when field not in by array", () => {
      const havingData: HavingUse = {
        nonExistentField: "value",
      };

      try {
        notPatternFilter(mockClassificationedRows, havingData, ["age", "name"]);
        fail("Expected function to throw an error");
      } catch (error: any) {
        expect(error.name).toBe("GassmaGroupByHavingDontWriteByError");
      }
    });

    test("should throw error for complex condition with field not in by array", () => {
      const havingData: HavingUse = {
        nonExistentField: { equals: "value" },
      };

      try {
        notPatternFilter(mockClassificationedRows, havingData, ["age", "name"]);
        fail("Expected function to throw an error");
      } catch (error: any) {
        expect(error.name).toBe("GassmaGroupByHavingDontWriteByError");
      }
    });

    test("should handle empty rows array", () => {
      const havingData: HavingUse = {
        city: "Tokyo",
      };

      const result = notPatternFilter([], havingData, byFields);

      expect(result).toHaveLength(0);
    });

    test("should handle no matching conditions", () => {
      const havingData: HavingUse = {
        city: "NonExistentCity",
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("transportation and filtering logic", () => {
    test("should properly transport and apply multiple field conditions", () => {
      const havingData: HavingUse = {
        age: { gte: 25, lte: 30 },
        score: { gt: 80 },
        city: { in: ["Tokyo", "Osaka"] },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Bob", "Eve"]);
    });

    test("should handle string conditions properly", () => {
      const havingData: HavingUse = {
        name: { startsWith: "C", endsWith: "e" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(1);
      expect(result[0].row[0].name).toBe("Charlie");
    });

    test("should handle numeric range conditions", () => {
      const havingData: HavingUse = {
        score: { gte: 85, lt: 95 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Bob",
        "David",
      ]);
    });
  });

  describe("boundary value testing", () => {
    test("should include boundary value with lte condition", () => {
      const havingData: HavingUse = {
        age: { lte: 25 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Charlie"]);
    });

    test("should exclude boundary value with lt condition", () => {
      const havingData: HavingUse = {
        age: { lt: 25 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(1);
      expect(result.map((r) => r.row[0].name)).toEqual(["Charlie"]);
    });

    test("should include boundary value with gte condition", () => {
      const havingData: HavingUse = {
        score: { gte: 85 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Bob",
        "David",
        "Eve",
      ]);
    });

    test("should exclude boundary value with gt condition", () => {
      const havingData: HavingUse = {
        score: { gt: 85 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.row[0].name)).toEqual(["Bob", "David", "Eve"]);
    });

    test("should handle exact boundary match with equals", () => {
      const havingData: HavingUse = {
        age: { equals: 28 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(1);
      expect(result.map((r) => r.row[0].name)).toEqual(["Eve"]);
    });

    test("should exclude exact boundary match with not condition", () => {
      const havingData: HavingUse = {
        score: { not: 88 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.row[0].name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "Eve",
      ]);
    });
  });

  describe("complex real-world scenarios", () => {
    test("should handle complex filtering scenario", () => {
      const havingData: HavingUse = {
        age: { gte: 25 },
        city: { not: "Kyoto" },
        score: { in: [85, 92, 95] },
        category: { startsWith: "A" },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Eve"]);
    });

    test("should handle mixed data types filtering", () => {
      const havingData: HavingUse = {
        age: { notIn: [22, 35] },
        city: { contains: "o" },
        score: { gte: 85 },
      };

      const result = notPatternFilter(
        mockClassificationedRows,
        havingData,
        byFields,
      );

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.row[0].name)).toEqual(["Alice", "Eve"]);
    });
  });
});
