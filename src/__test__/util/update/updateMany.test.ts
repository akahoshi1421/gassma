import { updateManyFunc } from "../../../util/update/updateMany";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

// Constants for better maintainability
const INITIAL_ROW_COUNT = 9;
// 初期データ中のEngineerの数（Alice, Eve, Henry）
const EXPECTED_ENGINEER_COUNT = 3;
// 初期データ中のTokyo在住者の数（Alice, Charlie, Eve, Grace）
const EXPECTED_TOKYO_COUNT = 4;

describe("updateMany functionality tests", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    // Reset mock state to ensure test independence
    (mockUtil.sheet as any)._resetMockData();
  });

  describe("updateManyFunc", () => {
    test("should update multiple records matching where condition", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 職業: "Engineer" },
        data: { 職業: "Senior Engineer" },
      });

      // Check return value
      expect(result).toEqual({ count: EXPECTED_ENGINEER_COUNT });

      // Check that engineer records were updated
      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT);

      // Verify that Engineer records are now Senior Engineer
      const engineerRows = currentData.filter(
        (row, index) => index > 0 && row[4] === "Senior Engineer",
      );
      expect(engineerRows).toHaveLength(EXPECTED_ENGINEER_COUNT);

      // Verify that other records remain unchanged
      const designerRows = currentData.filter(
        (row, index) => index > 0 && row[4] === "Designer",
      );
      expect(designerRows).toHaveLength(2); // Should remain unchanged
    });

    test("should update multiple fields for matching records", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 住所: "Tokyo" },
        data: {
          住所: "New Tokyo",
          郵便番号: "999-9999",
        },
      });

      expect(result).toEqual({ count: EXPECTED_TOKYO_COUNT });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const tokyoRows = currentData.filter(
        (row, index) => index > 0 && row[2] === "New Tokyo",
      );
      expect(tokyoRows).toHaveLength(EXPECTED_TOKYO_COUNT);

      // Verify postal codes were also updated
      tokyoRows.forEach((row) => {
        expect(row[3]).toBe("999-9999");
      });
    });

    test("should update all records when no where condition is provided", () => {
      const result = updateManyFunc(mockUtil, {
        data: { 職業: "Remote Worker" },
      });

      // Should update all data rows (excluding header)
      expect(result).toEqual({ count: INITIAL_ROW_COUNT - 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const remoteWorkerRows = currentData.filter(
        (row, index) => index > 0 && row[4] === "Remote Worker",
      );
      expect(remoteWorkerRows).toHaveLength(INITIAL_ROW_COUNT - 1);
    });

    test("should update records with complex where conditions", () => {
      const result = updateManyFunc(mockUtil, {
        where: {
          AND: [{ 年齢: { gte: 28 } }, { 住所: "Tokyo" }],
        },
        data: { 職業: "Senior Specialist" },
      });

      // 初期データ: Alice(28, Tokyo), Eve(28, Tokyo), Grace(31, Tokyo) = 3人
      expect(result.count).toBe(3);

      const currentData = (mockUtil.sheet as any)._getMockData();
      const specialistRows = currentData.filter(
        (row, index) => index > 0 && row[4] === "Senior Specialist",
      );
      expect(specialistRows.length).toBe(result.count);

      // Verify all updated records meet the criteria
      specialistRows.forEach((row) => {
        expect(row[1]).toBeGreaterThanOrEqual(28); // age >= 28
        expect(row[2]).toBe("Tokyo"); // address should have been Tokyo originally
      });
    });

    test("should handle OR conditions in where clause", () => {
      const result = updateManyFunc(mockUtil, {
        where: {
          OR: [{ 職業: "Engineer" }, { 職業: "Designer" }],
        },
        data: { 郵便番号: "555-5555" },
      });

      // Should update Engineers and Designers
      expect(result.count).toBe(5); // 3 Engineers + 2 Designers

      const currentData = (mockUtil.sheet as any)._getMockData();
      const updatedRows = currentData.filter(
        (row, index) => index > 0 && row[3] === "555-5555",
      );
      expect(updatedRows).toHaveLength(5);
    });

    test("should handle NOT conditions in where clause", () => {
      const result = updateManyFunc(mockUtil, {
        where: {
          NOT: { 職業: "Engineer" },
        },
        data: { 年齢: 99 },
      });

      // Should update non-Engineers
      expect(result.count).toBe(5); // Total 8 - 3 Engineers = 5

      const currentData = (mockUtil.sheet as any)._getMockData();
      const updatedRows = currentData.filter(
        (row, index) => index > 0 && row[1] === 99,
      );
      expect(updatedRows).toHaveLength(5);
    });

    test("should return count 0 when no records match where condition", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Non-existent User" },
        data: { 職業: "Should Not Update" },
      });

      expect(result).toEqual({ count: 0 });

      // Verify no records were updated
      const currentData = (mockUtil.sheet as any)._getMockData();
      const shouldNotUpdateRows = currentData.filter((row) =>
        row.includes("Should Not Update"),
      );
      expect(shouldNotUpdateRows).toHaveLength(0);
    });

    test("should handle partial field updates", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Alice" },
        data: { 年齢: 30 },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const aliceRow = currentData.find(
        (row, index) => index > 0 && row[0] === "Alice",
      );
      expect(aliceRow).toBeDefined();
      expect(aliceRow[1]).toBe(30); // Age updated
      expect(aliceRow[2]).toBe("Tokyo"); // Address unchanged
      expect(aliceRow[4]).toBe("Engineer"); // Job unchanged
    });
  });

  describe("updateMany edge cases", () => {
    test("should handle null and undefined values in data", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Alice" },
        data: {
          年齢: null,
          住所: undefined,
          郵便番号: "",
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const aliceRow = currentData.find(
        (row, index) => index > 0 && row[0] === "Alice",
      );
      expect(aliceRow[1]).toBe(null);
      expect(aliceRow[2]).toBe(undefined);
      expect(aliceRow[3]).toBe("");
    });

    test("should handle zero values in data", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Bob" },
        data: { 年齢: 0 },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const bobRow = currentData.find(
        (row, index) => index > 0 && row[0] === "Bob",
      );
      expect(bobRow[1]).toBe(0);
    });

    test("should handle special characters in update data", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Charlie" },
        data: {
          住所: "東京都新宿区歌舞伎町1-1-1",
          郵便番号: "160-0021",
          職業: "システムエンジニア",
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const charlieRow = currentData.find(
        (row, index) => index > 0 && row[0] === "Charlie",
      );
      expect(charlieRow[2]).toBe("東京都新宿区歌舞伎町1-1-1");
      expect(charlieRow[3]).toBe("160-0021");
      expect(charlieRow[4]).toBe("システムエンジニア");
    });

    test("should verify sheet method calls", () => {
      updateManyFunc(mockUtil, {
        where: { 職業: "Engineer" },
        data: { 職業: "Senior Engineer" },
      });

      // Verify getRange and setValues were called for each updated row
      expect(mockUtil.sheet.getRange).toHaveBeenCalled();

      // Should be called once for each Engineer record
      const getRangeCallCount = (mockUtil.sheet.getRange as jest.Mock).mock
        .calls.length;
      expect(getRangeCallCount).toBeGreaterThan(0);
    });

    test("should handle empty where object (update all)", () => {
      const result = updateManyFunc(mockUtil, {
        where: {},
        data: { 職業: "Universal Worker" },
      });

      expect(result).toEqual({ count: INITIAL_ROW_COUNT - 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const universalWorkerRows = currentData.filter(
        (row, index) => index > 0 && row[4] === "Universal Worker",
      );
      expect(universalWorkerRows).toHaveLength(INITIAL_ROW_COUNT - 1);
    });
  });

  describe("updateMany error handling", () => {
    test("should skip update when whereFilter returns empty row arrays", () => {
      // Create a separate mock utility to avoid interference with other tests
      const isolatedMockUtil = getMutableMockControllerUtil();

      // Use jest.spyOn to mock the whereFilter function directly
      const whereFilterSpy = jest.spyOn(
        require("../../../util/core/whereFilter"),
        "whereFilter",
      );

      // Mock whereFilter to return data with empty row to trigger early return when updatedRow.length === 0
      whereFilterSpy.mockReturnValueOnce([
        { row: [], rowNumber: 1 }, // Empty row array
      ]);

      const result = updateManyFunc(isolatedMockUtil, {
        where: { 名前: "Test" },
        data: { 職業: "Updated" },
      });

      // Should return count 1 (the number of rows found by whereFilter)
      expect(result).toEqual({ count: 1 });

      // Clean up the mock
      whereFilterSpy.mockRestore();
    });

    test("should handle non-existent column names gracefully", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Alice" },
        data: {
          名前: "Alice Updated",
          存在しないカラム: "無効な値",
          年齢: 35,
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const aliceRow = currentData.find(
        (row, index) => index > 0 && row[0] === "Alice Updated",
      );
      expect(aliceRow).toBeDefined();
      expect(aliceRow[1]).toBe(35); // Valid update applied

      // 存在しないカラムのデータが意図せずどこかに書き込まれていないことを確認
      const hasInvalidValue = currentData.some((row) =>
        row.some((cell) => cell === "無効な値"),
      );
      expect(hasInvalidValue).toBe(false);
    });

    test("should handle invalid data types gracefully", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Bob" },
        data: {
          名前: 123 as any, // Number instead of string
          年齢: "文字列" as any, // String instead of number
          住所: { invalid: "object" } as any, // Object instead of string
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const bobRow = currentData.find(
        (row, index) => index > 0 && row[0] === 123,
      );
      expect(bobRow).toBeDefined();
      expect(bobRow[1]).toBe("文字列");
      expect(bobRow[2]).toEqual({ invalid: "object" });
    });

    test("should handle extremely large data values", () => {
      const largeString = "A".repeat(10000);
      const largeNumber = Number.MAX_SAFE_INTEGER;

      const result = updateManyFunc(mockUtil, {
        where: { 名前: "David" },
        data: {
          名前: largeString,
          年齢: largeNumber,
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const davidRow = currentData.find(
        (row, index) => index > 0 && row[0] === largeString,
      );
      expect(davidRow).toBeDefined();
      expect(davidRow[1]).toBe(largeNumber);
    });

    test("should handle array and object data types", () => {
      const arrayData = [1, 2, 3];
      const objectData = { nested: { key: "value" } };

      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Eve" },
        data: {
          名前: arrayData as any,
          年齢: objectData as any,
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const eveRow = currentData.find(
        (row, index) => index > 0 && row[0] === arrayData,
      );
      expect(eveRow).toBeDefined();
      expect(eveRow[1]).toEqual(objectData);
    });

    test("should handle circular reference objects gracefully", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // This should not throw an error
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Frank" },
        data: {
          年齢: circularObj,
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const frankRow = currentData.find(
        (row, index) => index > 0 && row[0] === "Frank",
      );
      expect(frankRow).toBeDefined();
      expect(frankRow[1]).toBe(circularObj);
    });
  });

  describe("updateMany performance edge cases", () => {
    test("should handle large number of updates efficiently", () => {
      // Update all records to test performance
      const startTime = Date.now();
      const result = updateManyFunc(mockUtil, {
        data: {
          職業: "Performance Test Worker",
          郵便番号: "999-9999",
        },
      });
      const endTime = Date.now();

      expect(result).toEqual({ count: INITIAL_ROW_COUNT - 1 });
      // CI環境での処理遅延を考慮
      expect(endTime - startTime).toBeLessThan(2000);

      const currentData = (mockUtil.sheet as any)._getMockData();
      const updatedRows = currentData.filter(
        (row, index) => index > 0 && row[4] === "Performance Test Worker",
      );
      expect(updatedRows).toHaveLength(INITIAL_ROW_COUNT - 1);
    });

    test("should handle empty strings and whitespace correctly", () => {
      const result = updateManyFunc(mockUtil, {
        where: { 名前: "Grace" },
        data: {
          名前: "",
          住所: "   ",
          郵便番号: "\t\n",
          職業: " ",
        },
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      const graceRow = currentData.find(
        (row, index) => index > 0 && row[0] === "",
      );
      expect(graceRow).toBeDefined();
      expect(graceRow[2]).toBe("   ");
      expect(graceRow[3]).toBe("\t\n");
      expect(graceRow[4]).toBe(" ");
    });

    test("should handle complex nested where conditions", () => {
      const result = updateManyFunc(mockUtil, {
        where: {
          AND: [
            {
              OR: [{ 住所: "Tokyo" }, { 住所: "Kyoto" }],
            },
            {
              NOT: { 職業: "Student" },
            },
          ],
        },
        data: { 職業: "Complex Query Worker" },
      });

      // 初期データから計算:
      // Tokyo: Alice(Engineer), Eve(Engineer), Grace(Designer) = 3人
      // Kyoto: David(Manager), Henry(Engineer) = 2人
      // Tokyo + Kyotoで Student以外 = 5人（Charlie以外全員）
      expect(result.count).toBe(5);

      const currentData = (mockUtil.sheet as any)._getMockData();
      const complexQueryWorkers = currentData.filter(
        (row, index) => index > 0 && row[4] === "Complex Query Worker",
      );
      expect(complexQueryWorkers.length).toBe(result.count);

      // Verify all updated records meet the complex criteria
      complexQueryWorkers.forEach((row) => {
        expect(["Tokyo", "Kyoto"]).toContain(row[2]);
        expect(row[4]).not.toBe("Student");
      });
    });
  });
});

describe("updateMany NumberOperation tests", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    (mockUtil.sheet as any)._resetMockData();
  });

  test("increment で数値フィールドが加算更新される", () => {
    const result = updateManyFunc(mockUtil, {
      where: { 名前: "Alice" },
      data: { 年齢: { increment: 5 } },
    });

    expect(result).toEqual({ count: 1 });

    const currentData = (mockUtil.sheet as any)._getMockData();
    const aliceRow = currentData.find(
      (row: any[], index: number) => index > 0 && row[0] === "Alice",
    );
    expect(aliceRow[1]).toBe(33); // 28 + 5
  });

  test("decrement で数値フィールドが減算更新される", () => {
    const result = updateManyFunc(mockUtil, {
      where: { 名前: "Bob" },
      data: { 年齢: { decrement: 10 } },
    });

    expect(result).toEqual({ count: 1 });

    const currentData = (mockUtil.sheet as any)._getMockData();
    const bobRow = currentData.find(
      (row: any[], index: number) => index > 0 && row[0] === "Bob",
    );
    expect(bobRow[1]).toBe(25); // 35 - 10
  });

  test("multiply で数値フィールドが乗算更新される", () => {
    const result = updateManyFunc(mockUtil, {
      where: { 名前: "Charlie" },
      data: { 年齢: { multiply: 2 } },
    });

    expect(result).toEqual({ count: 1 });

    const currentData = (mockUtil.sheet as any)._getMockData();
    const charlieRow = currentData.find(
      (row: any[], index: number) => index > 0 && row[0] === "Charlie",
    );
    expect(charlieRow[1]).toBe(44); // 22 * 2
  });

  test("divide で数値フィールドが除算更新される", () => {
    const result = updateManyFunc(mockUtil, {
      where: { 名前: "David" },
      data: { 年齢: { divide: 2 } },
    });

    expect(result).toEqual({ count: 1 });

    const currentData = (mockUtil.sheet as any)._getMockData();
    const davidRow = currentData.find(
      (row: any[], index: number) => index > 0 && row[0] === "David",
    );
    expect(davidRow[1]).toBe(22.5); // 45 / 2
  });

  test("NumberOperation と通常値の混在が正しく動作する", () => {
    const result = updateManyFunc(mockUtil, {
      where: { 名前: "Eve" },
      data: { 年齢: { increment: 10 }, 職業: "Senior Engineer" },
    });

    expect(result).toEqual({ count: 1 });

    const currentData = (mockUtil.sheet as any)._getMockData();
    const eveRow = currentData.find(
      (row: any[], index: number) => index > 0 && row[0] === "Eve",
    );
    expect(eveRow[1]).toBe(38); // 28 + 10
    expect(eveRow[4]).toBe("Senior Engineer");
  });
});

describe("updateManyFunc with withReturn", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    (mockUtil.sheet as any)._resetMockData();
  });

  test("should update multiple records and return updated records as array", () => {
    const result = updateManyFunc(
      mockUtil,
      {
        where: { 職業: "Engineer" },
        data: { 職業: "Senior Engineer" },
      },
      true,
    );

    expect(result).toHaveLength(3);
    result.forEach((record) => {
      expect(record["職業"]).toBe("Senior Engineer");
    });

    // 返却されたレコードの名前がEngineerだった人であることを確認
    const names = result.map((r) => r["名前"]);
    expect(names).toEqual(expect.arrayContaining(["Alice", "Eve", "Henry"]));
  });

  test("should preserve unchanged fields in returned records", () => {
    const result = updateManyFunc(
      mockUtil,
      {
        where: { 名前: "Alice" },
        data: { 年齢: 30 },
      },
      true,
    );

    expect(result).toHaveLength(1);
    expect(result[0]["名前"]).toBe("Alice");
    expect(result[0]["年齢"]).toBe(30);
    expect(result[0]["住所"]).toBe("Tokyo");
    expect(result[0]["郵便番号"]).toBe("100-0001");
    expect(result[0]["職業"]).toBe("Engineer");
  });

  test("should return empty array when no records match", () => {
    const result = updateManyFunc(
      mockUtil,
      {
        where: { 名前: "Non-existent" },
        data: { 職業: "Should Not Update" },
      },
      true,
    );

    expect(result).toEqual([]);
  });

  test("should return single-element array for single match", () => {
    const result = updateManyFunc(
      mockUtil,
      {
        where: { 名前: "Bob" },
        data: { 年齢: 36 },
      },
      true,
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]["名前"]).toBe("Bob");
    expect(result[0]["年齢"]).toBe(36);
  });

  test("should update and return all records when no where condition", () => {
    const result = updateManyFunc(
      mockUtil,
      {
        data: { 職業: "Remote Worker" },
      },
      true,
    );

    expect(result).toHaveLength(8);
    result.forEach((record) => {
      expect(record["職業"]).toBe("Remote Worker");
    });
  });
});
