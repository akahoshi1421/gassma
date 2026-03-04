import { upsertFunc } from "../../../util/upsert/upsert";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

const INITIAL_ROW_COUNT = 9;

describe("upsertFunc", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    (mockUtil.sheet as any)._resetMockData();
  });

  test("レコードが存在しない場合は create データで新規作成して返す", () => {
    const result = upsertFunc(mockUtil, {
      where: { 名前: "NewPerson" },
      create: {
        名前: "NewPerson",
        年齢: 40,
        住所: "Fukuoka",
        郵便番号: "810-0001",
        職業: "Artist",
      },
      update: { 職業: "Updated Artist" },
    });

    expect(result).toEqual({
      名前: "NewPerson",
      年齢: 40,
      住所: "Fukuoka",
      郵便番号: "810-0001",
      職業: "Artist",
    });
  });

  test("レコードが存在する場合は update データで更新して返す", () => {
    const result = upsertFunc(mockUtil, {
      where: { 名前: "Alice" },
      create: {
        名前: "Alice",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0001",
        職業: "Engineer",
      },
      update: { 職業: "Tech Lead" },
    });

    expect(result).toEqual({
      名前: "Alice",
      年齢: 28,
      住所: "Tokyo",
      郵便番号: "100-0001",
      職業: "Tech Lead",
    });
  });

  test("作成後にシートのデータが正しく増えている", () => {
    upsertFunc(mockUtil, {
      where: { 名前: "NewPerson" },
      create: {
        名前: "NewPerson",
        年齢: 30,
        住所: "Sapporo",
        郵便番号: "060-0001",
        職業: "Chef",
      },
      update: { 職業: "Updated Chef" },
    });

    const currentData = (mockUtil.sheet as any)._getMockData();
    expect(currentData).toHaveLength(INITIAL_ROW_COUNT + 1);
  });

  test("更新後にシートのデータ件数は変わらない", () => {
    upsertFunc(mockUtil, {
      where: { 名前: "Alice" },
      create: {
        名前: "Alice",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0001",
        職業: "Engineer",
      },
      update: { 年齢: 30 },
    });

    const currentData = (mockUtil.sheet as any)._getMockData();
    expect(currentData).toHaveLength(INITIAL_ROW_COUNT);
  });
});
