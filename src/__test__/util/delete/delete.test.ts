import { deleteFunc } from "../../../util/delete/delete";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

const INITIAL_ROW_COUNT = 9;

describe("deleteFunc", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    (mockUtil.sheet as any)._resetMockData();
  });

  test("マッチするレコードを削除して返す", () => {
    const result = deleteFunc(mockUtil, { where: { 名前: "Alice" } });

    expect(result).toEqual({
      名前: "Alice",
      年齢: 28,
      住所: "Tokyo",
      郵便番号: "100-0001",
      職業: "Engineer",
    });

    const currentData = (mockUtil.sheet as any)._getMockData();
    expect(currentData).toHaveLength(INITIAL_ROW_COUNT - 1);
  });

  test("マッチしない場合は null を返す", () => {
    const result = deleteFunc(mockUtil, { where: { 名前: "NonExistent" } });

    expect(result).toBeNull();

    const currentData = (mockUtil.sheet as any)._getMockData();
    expect(currentData).toHaveLength(INITIAL_ROW_COUNT);
  });

  test("複数マッチしても1件だけ削除する", () => {
    const result = deleteFunc(mockUtil, { where: { 職業: "Engineer" } });

    expect(result).not.toBeNull();
    expect(result?.職業).toBe("Engineer");

    const currentData = (mockUtil.sheet as any)._getMockData();
    expect(currentData).toHaveLength(INITIAL_ROW_COUNT - 1);
  });

  test("削除後にシートのデータが正しく減っている", () => {
    deleteFunc(mockUtil, { where: { 名前: "Bob" } });

    const currentData = (mockUtil.sheet as any)._getMockData();
    expect(currentData).toHaveLength(INITIAL_ROW_COUNT - 1);

    const bobRow = currentData.find(
      (row: any, index: number) => index > 0 && row[0] === "Bob",
    );
    expect(bobRow).toBeUndefined();
  });
});
