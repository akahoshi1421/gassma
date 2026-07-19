import { findManyWithRelationOrderBy } from "../../../util/find/findManyWithRelationOrderBy";
import type { OrderBy } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

// 郵便番号 → rank。rank asc のソート結果がシート順とも逆シート順とも一致しないように付与
const addressRanks = [
  { code: "100-0003", rank: 1 },
  { code: "600-8000", rank: 2 },
  { code: "100-0001", rank: 3 },
  { code: "550-0002", rank: 4 },
  { code: "600-8001", rank: 5 },
  { code: "100-0002", rank: 6 },
  { code: "550-0001", rank: 7 },
  { code: "100-0004", rank: 8 },
];

const createRelationContext = (): RelationContext => ({
  relations: {
    address: {
      type: "manyToOne",
      to: "Addresses",
      field: "郵便番号",
      reference: "code",
    },
  },
  findManyOnSheet: (sheetName: string) =>
    sheetName === "Addresses" ? addressRanks : [],
});

const orderByArr: OrderBy[] = [{ address: { rank: "asc" } }];

const rows = {
  Alice: {
    名前: "Alice",
    年齢: 28,
    住所: "Tokyo",
    郵便番号: "100-0001",
    職業: "Engineer",
  },
  Bob: {
    名前: "Bob",
    年齢: 35,
    住所: "Osaka",
    郵便番号: "550-0001",
    職業: "Designer",
  },
  David: {
    名前: "David",
    年齢: 45,
    住所: "Kyoto",
    郵便番号: "600-8000",
    職業: "Manager",
  },
  Eve: {
    名前: "Eve",
    年齢: 28,
    住所: "Tokyo",
    郵便番号: "100-0003",
    職業: "Engineer",
  },
  Frank: {
    名前: "Frank",
    年齢: 52,
    住所: "Osaka",
    郵便番号: "550-0002",
    職業: "Director",
  },
  Grace: {
    名前: "Grace",
    年齢: 31,
    住所: "Tokyo",
    郵便番号: "100-0004",
    職業: "Designer",
  },
  Henry: {
    名前: "Henry",
    年齢: 28,
    住所: "Kyoto",
    郵便番号: "600-8001",
    職業: "Engineer",
  },
};

// rank asc のソート結果: Eve, David, Alice, Frank, Henry, Charlie, Bob, Grace
// 住所:               Tokyo, Kyoto, Tokyo, Osaka, Kyoto, Tokyo,  Osaka, Tokyo
describe("findManyWithRelationOrderBy distinct の適用位置 (Prisma パリティ)", () => {
  const mockUtil = getExtendedMockControllerUtil();
  const context = createRelationContext();

  it("relation ソート後に distinct を適用する", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { distinct: "住所" },
      context,
      orderByArr,
    );

    expect(result).toEqual([rows.Eve, rows.David, rows.Frank]);
  });

  it("distinct 後に skip する", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { distinct: "住所", skip: 1 },
      context,
      orderByArr,
    );

    expect(result).toEqual([rows.David, rows.Frank]);
  });

  it("take 負数はソート後の反転順で distinct し正順で返す", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { distinct: "住所", take: -2 },
      context,
      orderByArr,
    );

    expect(result).toEqual([rows.Bob, rows.Grace]);
  });

  it("cursor 位置決め後に distinct する", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "Alice" }, distinct: "住所" },
      context,
      orderByArr,
    );

    expect(result).toEqual([rows.Alice, rows.Frank, rows.Henry]);
  });

  it("distinct と select を併用できる", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { distinct: "住所", select: { 名前: true } },
      context,
      orderByArr,
    );

    expect(result).toEqual([
      { 名前: "Eve" },
      { 名前: "David" },
      { 名前: "Frank" },
    ]);
  });

  it("distinct なしの take 負数は従来どおりソート後の末尾 2 件を正順で返す", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { take: -2 },
      context,
      orderByArr,
    );

    expect(result).toEqual([rows.Bob, rows.Grace]);
  });

  it("distinct なしの cursor + take 負数は従来どおり cursor までの末尾 2 件を返す", () => {
    const result = findManyWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "Frank" }, take: -2 },
      context,
      orderByArr,
    );

    expect(result).toEqual([rows.Alice, rows.Frank]);
  });
});
