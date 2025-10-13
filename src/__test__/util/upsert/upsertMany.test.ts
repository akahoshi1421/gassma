import { upsertManyFunc } from "../../../util/upsert/upsertMany";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

describe("upsertMany functionality tests", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    // Reset mock state to ensure test independence
    (mockUtil.sheet as any)._resetMockData();
  });

  describe("upsertManyFunc", () => {
    describe("Update scenarios (when records match where condition)", () => {
      test("should update existing records when where condition matches", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 職業: "Engineer" },
          update: { 職業: "Senior Engineer" },
          create: {
            名前: "New Engineer",
            年齢: 30,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "Senior Engineer",
          },
        });

        // Should update existing Engineer records (Alice, Eve, Henry - 3 records)
        expect(result).toEqual({ count: 3 });

        // Verify that Engineer records were updated to Senior Engineer
        const currentData = (mockUtil.sheet as any)._getMockData();
        const seniorEngineerRows = currentData.filter(
          (row, index) => index > 0 && row[4] === "Senior Engineer",
        );
        expect(seniorEngineerRows).toHaveLength(3);

        // Verify that no new record was created (total count remains the same)
        expect(currentData).toHaveLength(9); // 1 header + 8 data rows
      });

      test("should update with complex where conditions", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 住所: "Tokyo", 職業: "Engineer" },
          update: { 年齢: 35 },
          create: {
            名前: "New Tokyo Engineer",
            年齢: 35,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "Engineer",
          },
        });

        // Should update Tokyo Engineers (Alice, Eve - 2 records)
        expect(result).toEqual({ count: 2 });

        // Verify that Tokyo Engineer records were updated
        const currentData = (mockUtil.sheet as any)._getMockData();
        const tokyoEngineers = currentData.filter(
          (row, index) =>
            index > 0 && row[2] === "Tokyo" && row[4] === "Engineer",
        );

        // Both Tokyo Engineers should now have age 35
        tokyoEngineers.forEach((row) => {
          expect(row[1]).toBe(35);
        });
      });

      test("should handle numeric where conditions for updates", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 年齢: 28 },
          update: { 年齢: 29 },
          create: {
            名前: "Age 28",
            年齢: 29,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "Worker",
          },
        });

        // Should update records with age 28 (Alice, Eve, Henry - 3 records)
        expect(result).toEqual({ count: 3 });

        // Verify that age 28 records were updated to age 29
        const currentData = (mockUtil.sheet as any)._getMockData();
        const age29Records = currentData.filter(
          (row, index) => index > 0 && row[1] === 29,
        );
        expect(age29Records).toHaveLength(3);
      });

      test("should handle multiple field updates", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 名前: "Alice" },
          update: { 年齢: 30, 住所: "Shibuya", 職業: "Tech Lead" },
          create: {
            名前: "Alice",
            年齢: 30,
            住所: "Shibuya",
            郵便番号: "150-0001",
            職業: "Tech Lead",
          },
        });

        // Should update Alice's record
        expect(result).toEqual({ count: 1 });

        // Verify Alice's record was updated
        const currentData = (mockUtil.sheet as any)._getMockData();
        const aliceRecord = currentData.find(
          (row, index) => index > 0 && row[0] === "Alice",
        );
        expect(aliceRecord).toEqual([
          "Alice",
          30,
          "Shibuya",
          "100-0001",
          "Tech Lead",
        ]);
      });

      test("should preserve existing data not specified in update", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 名前: "Alice" },
          update: { 職業: "Team Lead" }, // Only update job title
          create: {
            名前: "Alice",
            年齢: 25,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "Team Lead",
          },
        });

        // Should update Alice's record
        expect(result).toEqual({ count: 1 });

        // Verify only job title was updated, other fields preserved
        const currentData = (mockUtil.sheet as any)._getMockData();
        const aliceRecord = currentData.find(
          (row, index) => index > 0 && row[0] === "Alice",
        );
        // Age (28), address (Tokyo), and postal code (100-0001) should be preserved
        expect(aliceRecord).toEqual([
          "Alice",
          28,
          "Tokyo",
          "100-0001",
          "Team Lead",
        ]);
      });
    });

    describe("Create scenarios (when no records match where condition)", () => {
      test("should create new record when where condition does not match", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 職業: "CEO" }, // Non-existent job title
          update: { 職業: "Chief Executive Officer" },
          create: {
            名前: "New CEO",
            年齢: 50,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "CEO",
          },
        });

        // Should create a new record since no CEO exists
        expect(result).toEqual({ count: 1 });

        // Verify that a new record was created
        const currentData = (mockUtil.sheet as any)._getMockData();
        expect(currentData).toHaveLength(10); // 1 header + 8 original + 1 new

        // Verify the new record was created with correct data
        const newRecord = currentData[9]; // Last record
        expect(newRecord).toEqual(["New CEO", 50, "Tokyo", "100-0001", "CEO"]);
      });

      test("should create record when complex where condition does not match", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 住所: "Nagoya", 職業: "Engineer" }, // No Nagoya Engineers exist
          update: { 年齢: 40 },
          create: {
            名前: "Nagoya Engineer",
            年齢: 40,
            住所: "Nagoya",
            郵便番号: "460-0001",
            職業: "Engineer",
          },
        });

        // Should create a new record since no Nagoya Engineers exist
        expect(result).toEqual({ count: 1 });

        // Verify that a new record was created
        const currentData = (mockUtil.sheet as any)._getMockData();
        expect(currentData).toHaveLength(10); // 1 header + 8 original + 1 new

        // Verify the new record with create data
        const newRecord = currentData[9];
        expect(newRecord).toEqual([
          "Nagoya Engineer",
          40,
          "Nagoya",
          "460-0001",
          "Engineer",
        ]);
      });

      test("should create record when numeric where condition does not match", () => {
        const result = upsertManyFunc(mockUtil, {
          where: { 年齢: 99 }, // Non-existent age
          update: { 年齢: 100 },
          create: {
            名前: "Centenarian",
            年齢: 99,
            住所: "Tokyo",
            郵便番号: "100-0001",
            職業: "Retiree",
          },
        });

        // Should create a new record since no one is age 99
        expect(result).toEqual({ count: 1 });

        // Verify that a new record was created
        const currentData = (mockUtil.sheet as any)._getMockData();
        expect(currentData).toHaveLength(10);

        const newRecord = currentData[9];
        expect(newRecord).toEqual([
          "Centenarian",
          99,
          "Tokyo",
          "100-0001",
          "Retiree",
        ]);
      });
    });

    describe("Edge cases", () => {
      test("should handle empty where condition by updating first matching record", () => {
        const result = upsertManyFunc(mockUtil, {
          where: {}, // Empty where condition
          update: { 職業: "Updated" },
          create: {
            名前: "Empty Where",
            年齢: 0,
            住所: "Unknown",
            郵便番号: "000-0000",
            職業: "Updated",
          },
        });

        // With empty where condition, findFirst should return the first record
        // This will update that record
        expect(result.count).toBeGreaterThan(0);

        // Verify that some record was updated
        const currentData = (mockUtil.sheet as any)._getMockData();
        expect(currentData).toHaveLength(9); // No new records created
      });
    });
  });
});
