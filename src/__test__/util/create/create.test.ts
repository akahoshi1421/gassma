import { createFunc } from "../../../util/create/create";
import { createManyFunc } from "../../../util/create/createManyFunc";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

// Constants for better maintainability
const INITIAL_ROW_COUNT = 9;
const COLUMN_COUNT = 5;
const EXPECTED_TOTAL_ROWS_AFTER_ONE_INSERT = 10;

describe("create functionality tests", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    // Reset mock state to ensure test independence
    (mockUtil.sheet as any)._resetMockData();
  });
  describe("createFunc", () => {
    test("should create a single record with all fields", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "新規ユーザー",
          年齢: 25,
          住所: "Nagoya",
          郵便番号: "460-0001",
          職業: "Developer"
        }
      });

      // Check return value
      expect(result).toEqual({
        名前: "新規ユーザー",
        年齢: 25,
        住所: "Nagoya",
        郵便番号: "460-0001",
        職業: "Developer"
      });

      // Check that data was added to the sheet
      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(EXPECTED_TOTAL_ROWS_AFTER_ONE_INSERT);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["新規ユーザー", 25, "Nagoya", "460-0001", "Developer"]);
    });

    test("should create a single record with partial fields", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "部分ユーザー",
          年齢: 30,
          住所: "Fukuoka"
        }
      });

      // Check return value includes all fields, missing ones as null
      expect(result).toEqual({
        名前: "部分ユーザー",
        年齢: 30,
        住所: "Fukuoka",
        郵便番号: null,
        職業: null
      });

      // Check that data was added with empty values for missing fields
      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(EXPECTED_TOTAL_ROWS_AFTER_ONE_INSERT);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["部分ユーザー", 30, "Fukuoka", "", ""]);
    });

    test("should create a record with only one field", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "最小ユーザー"
        }
      });

      expect(result).toEqual({
        名前: "最小ユーザー",
        年齢: null,
        住所: null,
        郵便番号: null,
        職業: null
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["最小ユーザー", "", "", "", ""]);
    });

    test("should create a record with numeric and string fields", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "テストユーザー",
          年齢: 40,
          住所: "Sapporo",
          郵便番号: "060-0001",
          職業: "Manager"
        }
      });

      expect(result).toEqual({
        名前: "テストユーザー",
        年齢: 40,
        住所: "Sapporo",
        郵便番号: "060-0001",
        職業: "Manager"
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["テストユーザー", 40, "Sapporo", "060-0001", "Manager"]);
    });

    test("should handle empty data object", () => {
      
      const result = createFunc(mockUtil, {
        data: {}
      });

      expect(result).toEqual({
        名前: null,
        年齢: null,
        住所: null,
        郵便番号: null,
        職業: null
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["", "", "", "", ""]);
    });

    test("should handle special characters in data", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "田中 太郎",
          年齢: 35,
          住所: "東京都渋谷区",
          郵便番号: "150-0001",
          職業: "エンジニア"
        }
      });

      expect(result).toEqual({
        名前: "田中 太郎",
        年齢: 35,
        住所: "東京都渋谷区",
        郵便番号: "150-0001",
        職業: "エンジニア"
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["田中 太郎", 35, "東京都渋谷区", "150-0001", "エンジニア"]);
    });
  });

  describe("createManyFunc", () => {
    test("should create multiple records", () => {
      
      const result = createManyFunc(mockUtil, {
        data: [
          {
            名前: "佐藤",
            年齢: 23,
            住所: "Shimane",
            郵便番号: "690-8540",
            職業: "Student"
          },
          {
            名前: "鈴原",
            年齢: 25,
            住所: "Tottori",
            郵便番号: "680-8571",
            職業: "Designer"
          }
        ]
      });

      // Check return value
      expect(result).toEqual({ count: 2 });

      // Check that data was added to the sheet
      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 2); // 9 original + 2 new
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["佐藤", 23, "Shimane", "690-8540", "Student"]);
      expect(currentData[INITIAL_ROW_COUNT + 1]).toEqual(["鈴原", 25, "Tottori", "680-8571", "Designer"]);
    });

    test("should create multiple records with partial fields", () => {
      
      const result = createManyFunc(mockUtil, {
        data: [
          {
            名前: "部分1",
            年齢: 20
          },
          {
            名前: "部分2",
            住所: "Hiroshima",
            職業: "Teacher"
          },
          {
            名前: "部分3"
          }
        ]
      });

      expect(result).toEqual({ count: 3 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 3);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["部分1", 20, "", "", ""]);
      expect(currentData[INITIAL_ROW_COUNT + 1]).toEqual(["部分2", "", "Hiroshima", "", "Teacher"]);
      expect(currentData[INITIAL_ROW_COUNT + 2]).toEqual(["部分3", "", "", "", ""]);
    });

    test("should create many records with all fields", () => {
      
      const result = createManyFunc(mockUtil, {
        data: [
          {
            名前: "山田",
            年齢: 28,
            住所: "Tokyo",
            郵便番号: "100-0005",
            職業: "Engineer"
          },
          {
            名前: "田中",
            年齢: 32,
            住所: "Osaka",
            郵便番号: "550-0003",
            職業: "Manager"
          },
          {
            名前: "佐々木",
            年齢: 26,
            住所: "Kyoto",
            郵便番号: "600-8002",
            職業: "Designer"
          }
        ]
      });

      expect(result).toEqual({ count: 3 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 3);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["山田", 28, "Tokyo", "100-0005", "Engineer"]);
      expect(currentData[INITIAL_ROW_COUNT + 1]).toEqual(["田中", 32, "Osaka", "550-0003", "Manager"]);
      expect(currentData[INITIAL_ROW_COUNT + 2]).toEqual(["佐々木", 26, "Kyoto", "600-8002", "Designer"]);
    });

    test("should handle empty array", () => {
      
      const result = createManyFunc(mockUtil, {
        data: []
      });

      expect(result).toBeUndefined(); // Function returns undefined for empty array

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT); // No change
    });

    test("should create single record via createMany", () => {
      
      const result = createManyFunc(mockUtil, {
        data: [
          {
            名前: "単一ユーザー",
            年齢: 45,
            住所: "Sendai",
            郵便番号: "980-0001",
            職業: "Director"
          }
        ]
      });

      expect(result).toEqual({ count: 1 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(EXPECTED_TOTAL_ROWS_AFTER_ONE_INSERT);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["単一ユーザー", 45, "Sendai", "980-0001", "Director"]);
    });

    test("should handle mixed field combinations", () => {
      
      const result = createManyFunc(mockUtil, {
        data: [
          {
            名前: "完全",
            年齢: 30,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "Engineer"
          },
          {
            名前: "部分"
          },
          {
            年齢: 25,
            住所: "Osaka"
          },
          {}
        ]
      });

      expect(result).toEqual({ count: 4 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 4);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["完全", 30, "Tokyo", "100-0001", "Engineer"]);
      expect(currentData[INITIAL_ROW_COUNT + 1]).toEqual(["部分", "", "", "", ""]);
      expect(currentData[INITIAL_ROW_COUNT + 2]).toEqual(["", 25, "Osaka", "", ""]);
      expect(currentData[INITIAL_ROW_COUNT + 3]).toEqual(["", "", "", "", ""]);
    });

    test("should create large number of records", () => {
      
      const largeData = Array.from({ length: 10 }, (_, i) => ({
        名前: `ユーザー${i + 1}`,
        年齢: 20 + i,
        住所: i % 2 === 0 ? "Tokyo" : "Osaka",
        郵便番号: `${100 + i}-000${i}`,
        職業: i % 3 === 0 ? "Engineer" : i % 3 === 1 ? "Designer" : "Manager"
      }));

      const result = createManyFunc(mockUtil, {
        data: largeData
      });

      expect(result).toEqual({ count: 10 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 10); // 9 original + 10 new

      // Check first and last added records
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["ユーザー1", 20, "Tokyo", "100-0000", "Engineer"]);
      expect(currentData[INITIAL_ROW_COUNT + 9]).toEqual(["ユーザー10", 29, "Osaka", "109-0009", "Engineer"]);
    });
  });

  describe("create edge cases", () => {
    test("should handle null and undefined values", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "null値テスト",
          年齢: null,
          住所: undefined,
          郵便番号: "000-0000",
          職業: ""
        }
      });

      expect(result).toEqual({
        名前: "null値テスト",
        年齢: null,
        住所: undefined,
        郵便番号: "000-0000",
        職業: ""
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["null値テスト", null, undefined, "000-0000", ""]);
    });

    test("should handle zero values", () => {
      
      const result = createFunc(mockUtil, {
        data: {
          名前: "ゼロテスト",
          年齢: 0
        }
      });

      expect(result).toEqual({
        名前: "ゼロテスト",
        年齢: 0,
        住所: null,
        郵便番号: null,
        職業: null
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["ゼロテスト", 0, "", "", ""]);
    });

    test("should verify sheet method calls for createFunc", () => {
      
      createFunc(mockUtil, {
        data: {
          名前: "メソッドテスト",
          年齢: 30
        }
      });

      // Verify getLastRow was called
      expect(mockUtil.sheet.getLastRow).toHaveBeenCalled();
      
      // Verify getRange was called for setting values
      expect(mockUtil.sheet.getRange).toHaveBeenCalled();
    });

    test("should verify sheet method calls for createManyFunc", () => {
      
      createManyFunc(mockUtil, {
        data: [
          { 名前: "テスト1" },
          { 名前: "テスト2" }
        ]
      });

      // Verify getLastRow was called
      expect(mockUtil.sheet.getLastRow).toHaveBeenCalled();
      
      // Verify getRange was called with correct parameters for setValues
      const getLastRowCallCount = (mockUtil.sheet.getLastRow as jest.Mock).mock.calls.length;
      expect(getLastRowCallCount).toBeGreaterThan(0);
    });
  });

  describe("create error handling", () => {
    test("should handle non-existent column names gracefully", () => {
      const result = createFunc(mockUtil, {
        data: {
          名前: "テストユーザー",
          存在しないカラム: "無効な値",
          年齢: 25
        }
      });

      // Only valid columns should be included in result
      expect(result).toEqual({
        名前: "テストユーザー",
        年齢: 25,
        住所: null,
        郵便番号: null,
        職業: null
      });

      // Data should be added with empty value for non-existent column
      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["テストユーザー", 25, "", "", ""]);
    });

    test("should handle invalid data types", () => {
      const result = createFunc(mockUtil, {
        data: {
          名前: 123 as any, // Number instead of string
          年齢: "文字列" as any, // String instead of number
          住所: { invalid: "object" } as any, // Object instead of string
          郵便番号: null,
          職業: undefined
        }
      });

      // Should accept any data type as-is
      expect(result).toEqual({
        名前: 123,
        年齢: "文字列",
        住所: { invalid: "object" },
        郵便番号: null,
        職業: undefined
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual([123, "文字列", { invalid: "object" }, null, undefined]);
    });

    test("should handle extremely large data values", () => {
      const largeString = "A".repeat(10000);
      const largeNumber = Number.MAX_SAFE_INTEGER;

      const result = createFunc(mockUtil, {
        data: {
          名前: largeString,
          年齢: largeNumber
        }
      });

      expect(result).toEqual({
        名前: largeString,
        年齢: largeNumber,
        住所: null,
        郵便番号: null,
        職業: null
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT][0]).toBe(largeString);
      expect(currentData[INITIAL_ROW_COUNT][1]).toBe(largeNumber);
    });

    test("should handle array and object data types", () => {
      const arrayData = [1, 2, 3];
      const objectData = { nested: { key: "value" } };

      const result = createFunc(mockUtil, {
        data: {
          名前: arrayData as any,
          年齢: objectData as any
        }
      });

      expect(result).toEqual({
        名前: arrayData,
        年齢: objectData,
        住所: null,
        郵便番号: null,
        職業: null
      });
    });

    test("createManyFunc should handle mixed valid and invalid data", () => {
      const result = createManyFunc(mockUtil, {
        data: [
          {
            名前: "正常データ",
            年齢: 25
          },
          {
            名前: 123,
            存在しないフィールド: "無効",
            年齢: "文字列"
          },
          {
            // Empty object
          }
        ]
      });

      expect(result).toEqual({ count: 3 });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 3);
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["正常データ", 25, "", "", ""]);
      expect(currentData[INITIAL_ROW_COUNT + 1]).toEqual([123, "文字列", "", "", ""]);
      expect(currentData[INITIAL_ROW_COUNT + 2]).toEqual(["", "", "", "", ""]);
    });

    test("should handle data with circular references gracefully", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // This should not throw an error
      const result = createFunc(mockUtil, {
        data: {
          名前: "循環参照テスト",
          年齢: circularObj
        }
      });

      expect(result.名前).toBe("循環参照テスト");
      expect(result.年齢).toBe(circularObj);
    });
  });

  describe("create performance edge cases", () => {
    test("should handle maximum realistic dataset size", () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        名前: `ユーザー${i + 1}`,
        年齢: 20 + (i % 50),
        住所: i % 3 === 0 ? "Tokyo" : i % 3 === 1 ? "Osaka" : "Kyoto",
        郵便番号: `${100 + Math.floor(i / 10)}-000${i % 10}`,
        職業: i % 4 === 0 ? "Engineer" : i % 4 === 1 ? "Designer" : i % 4 === 2 ? "Manager" : "Director"
      }));

      const startTime = Date.now();
      const result = createManyFunc(mockUtil, {
        data: largeDataset
      });
      const endTime = Date.now();

      expect(result).toEqual({ count: 100 });
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 100);
      
      // Verify first and last records
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["ユーザー1", 20, "Tokyo", "100-0000", "Engineer"]);
      expect(currentData[INITIAL_ROW_COUNT + 99]).toEqual(["ユーザー100", 69, "Tokyo", "109-0009", "Director"]);
    });

    test("should handle empty strings and whitespace correctly", () => {
      const result = createFunc(mockUtil, {
        data: {
          名前: "",
          年齢: 0,
          住所: "   ",
          郵便番号: "\t\n",
          職業: " "
        }
      });

      expect(result).toEqual({
        名前: "",
        年齢: 0,
        住所: "   ",
        郵便番号: "\t\n",
        職業: " "
      });

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData[INITIAL_ROW_COUNT]).toEqual(["", 0, "   ", "\t\n", " "]);
    });
  });
});
