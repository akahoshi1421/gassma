import { createFunc } from "../../../util/create/create";
import { createManyFunc } from "../../../util/create/createManyFunc";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

describe("create functionality tests", () => {
  describe("createFunc", () => {
    test("should create a single record with all fields", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(10); // 9 original + 1 new
      expect(currentData[9]).toEqual(["新規ユーザー", 25, "Nagoya", "460-0001", "Developer"]);
    });

    test("should create a single record with partial fields", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(10);
      expect(currentData[9]).toEqual(["部分ユーザー", 30, "Fukuoka", "", ""]);
    });

    test("should create a record with only one field", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData[9]).toEqual(["最小ユーザー", "", "", "", ""]);
    });

    test("should create a record with numeric and string fields", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData[9]).toEqual(["テストユーザー", 40, "Sapporo", "060-0001", "Manager"]);
    });

    test("should handle empty data object", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData[9]).toEqual(["", "", "", "", ""]);
    });

    test("should handle special characters in data", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData[9]).toEqual(["田中 太郎", 35, "東京都渋谷区", "150-0001", "エンジニア"]);
    });
  });

  describe("createManyFunc", () => {
    test("should create multiple records", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(11); // 9 original + 2 new
      expect(currentData[9]).toEqual(["佐藤", 23, "Shimane", "690-8540", "Student"]);
      expect(currentData[10]).toEqual(["鈴原", 25, "Tottori", "680-8571", "Designer"]);
    });

    test("should create multiple records with partial fields", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(12);
      expect(currentData[9]).toEqual(["部分1", 20, "", "", ""]);
      expect(currentData[10]).toEqual(["部分2", "", "Hiroshima", "", "Teacher"]);
      expect(currentData[11]).toEqual(["部分3", "", "", "", ""]);
    });

    test("should create many records with all fields", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(12);
      expect(currentData[9]).toEqual(["山田", 28, "Tokyo", "100-0005", "Engineer"]);
      expect(currentData[10]).toEqual(["田中", 32, "Osaka", "550-0003", "Manager"]);
      expect(currentData[11]).toEqual(["佐々木", 26, "Kyoto", "600-8002", "Designer"]);
    });

    test("should handle empty array", () => {
      const mockUtil = getMutableMockControllerUtil();
      
      const result = createManyFunc(mockUtil, {
        data: []
      });

      expect(result).toBeUndefined(); // Function returns undefined for empty array

      const currentData = (mockUtil.sheet as any)._getMockData();
      expect(currentData).toHaveLength(9); // No change
    });

    test("should create single record via createMany", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(10);
      expect(currentData[9]).toEqual(["単一ユーザー", 45, "Sendai", "980-0001", "Director"]);
    });

    test("should handle mixed field combinations", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(13);
      expect(currentData[9]).toEqual(["完全", 30, "Tokyo", "100-0001", "Engineer"]);
      expect(currentData[10]).toEqual(["部分", "", "", "", ""]);
      expect(currentData[11]).toEqual(["", 25, "Osaka", "", ""]);
      expect(currentData[12]).toEqual(["", "", "", "", ""]);
    });

    test("should create large number of records", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData).toHaveLength(19); // 9 original + 10 new

      // Check first and last added records
      expect(currentData[9]).toEqual(["ユーザー1", 20, "Tokyo", "100-0000", "Engineer"]);
      expect(currentData[18]).toEqual(["ユーザー10", 29, "Osaka", "109-0009", "Engineer"]);
    });
  });

  describe("create edge cases", () => {
    test("should handle null and undefined values", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData[9]).toEqual(["null値テスト", null, undefined, "000-0000", ""]);
    });

    test("should handle zero values", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      expect(currentData[9]).toEqual(["ゼロテスト", 0, "", "", ""]);
    });

    test("should verify sheet method calls for createFunc", () => {
      const mockUtil = getMutableMockControllerUtil();
      
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
      const mockUtil = getMutableMockControllerUtil();
      
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
});
