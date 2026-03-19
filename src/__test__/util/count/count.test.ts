import { countFunc } from "../../../util/count/count";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("count functionality tests", () => {
  describe("countFunc", () => {
    test("should count all records without conditions", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {});

      expect(result).toBe(8);
    });

    test("should work with where condition", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 住所: "Tokyo" },
      });

      expect(result).toBe(4);
    });

    test("should work with complex where conditions", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 年齢: { gte: 30 } },
      });

      expect(result).toBe(4);
    });

    test("should work with orderBy (though it doesn't affect count)", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        orderBy: { 年齢: "desc" },
      });

      expect(result).toBe(8);
    });

    test("should work with skip", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        skip: 3,
      });

      expect(result).toBe(5);
    });

    test("should work with take", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        take: 3,
      });

      expect(result).toBe(3);
    });

    test("should work with skip and take combined", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        skip: 2,
        take: 3,
      });

      expect(result).toBe(3);
    });

    test("should work with all parameters combined", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 年齢: { gte: 25 } },
        orderBy: { 年齢: "asc" },
        skip: 1,
        take: 4,
      });

      expect(result).toBe(4);
    });

    test("should return 0 when no records match", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 名前: "NonExistent" },
      });

      expect(result).toBe(0);
    });

    test("should handle empty result after skip", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        skip: 20,
      });

      expect(result).toBe(0);
    });

    test("should work with specific field filtering", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 職業: "Engineer" },
      });

      expect(result).toBe(3);
    });

    test("should count records with age filtering", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 年齢: 28 },
      });

      expect(result).toBe(3);
    });

    test("should work with AND conditions", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: {
          住所: "Tokyo",
          年齢: { gte: 25 },
        },
      });

      expect(result).toBe(3);
    });

    test("should work with range filtering", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: {
          年齢: {
            gte: 25,
            lte: 35,
          },
        },
      });

      expect(result).toBe(5);
    });
  });

  describe("countFunc with cursor", () => {
    test("should count records from cursor position", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        cursor: { 名前: "Charlie" },
      });

      // Charlie(3) + David(4) + Eve(5) + Frank(6) + Grace(7) + Henry(8) = 6
      expect(result).toBe(6);
    });

    test("should work with cursor and take", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        cursor: { 名前: "Charlie" },
        take: 3,
      });

      // Charlie, David, Eve = 3
      expect(result).toBe(3);
    });

    test("should work with cursor and negative take", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        cursor: { 名前: "Eve" },
        take: -3,
      });

      // cursor slices start to Eve: Alice,Bob,Charlie,David,Eve → take -3 → Charlie,David,Eve = 3
      expect(result).toBe(3);
    });

    test("should work with cursor and where", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        where: { 住所: "Tokyo" },
        cursor: { 名前: "Charlie" },
      });

      // After cursor in Tokyo-filtered: Charlie, Eve, Grace = 3
      expect(result).toBe(3);
    });

    test("should work with cursor and skip", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        cursor: { 名前: "Charlie" },
        skip: 2,
      });

      // From Charlie: Charlie, David, Eve, Frank, Grace, Henry → skip 2 → Eve, Frank, Grace, Henry = 4
      expect(result).toBe(4);
    });

    test("should return 0 when cursor not found", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        cursor: { 名前: "NonExistent" },
      });

      expect(result).toBe(0);
    });
  });

  describe("count edge cases", () => {
    test("should handle take=0", () => {
      const result = countFunc(getExtendedMockControllerUtil(), {
        take: 0,
      });

      expect(result).toBe(0);
    });

    test("should throw error when skip is negative", () => {
      expect(() =>
        countFunc(getExtendedMockControllerUtil(), {
          skip: -1,
        }),
      ).toThrow(
        "Invalid value for skip argument: Value can only be positive, found: -1",
      );
    });
  });
});
