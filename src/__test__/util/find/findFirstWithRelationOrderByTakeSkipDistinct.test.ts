import { findFirstWithRelationOrderBy } from "../../../util/find/findFirstWithRelationOrderBy";
import type { OrderBy } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

// 郵便番号 → rank（シート順の逆順になるように付与）
const addressRanks = [
  { code: "100-0001", rank: 8 },
  { code: "550-0001", rank: 7 },
  { code: "100-0002", rank: 6 },
  { code: "600-8000", rank: 5 },
  { code: "100-0003", rank: 4 },
  { code: "550-0002", rank: 3 },
  { code: "100-0004", rank: 2 },
  { code: "600-8001", rank: 1 },
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

// rank asc のソート結果: Henry, Grace, Frank, Eve, David, Charlie, Bob, Alice
describe("findFirstWithRelationOrderBy take/skip/distinct", () => {
  const mockUtil = getExtendedMockControllerUtil();
  const context = createRelationContext();

  it("take: 1 はソート後の先頭を返す", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { take: 1 },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "Henry",
      年齢: 28,
      住所: "Kyoto",
      郵便番号: "600-8001",
      職業: "Engineer",
    });
  });

  it("take: -1 はソート後の並びを反転して末尾を返す", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { take: -1 },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "Alice",
      年齢: 28,
      住所: "Tokyo",
      郵便番号: "100-0001",
      職業: "Engineer",
    });
  });

  it("take: 2 はエラー", () => {
    expect(() =>
      findFirstWithRelationOrderBy(mockUtil, { take: 2 }, context, orderByArr),
    ).toThrow(
      "The 'findFirst' operation cannot be used with a 'take' argument that isn't 1 or -1",
    );
  });

  it("skip: 1 はソート後の並びで skip する", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { skip: 1 },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "Grace",
      年齢: 31,
      住所: "Tokyo",
      郵便番号: "100-0004",
      職業: "Designer",
    });
  });

  it("skip が件数を超えると null を返す", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { skip: 100 },
      context,
      orderByArr,
    );

    expect(result).toBeNull();
  });

  it("skip: -1 はエラー", () => {
    expect(() =>
      findFirstWithRelationOrderBy(mockUtil, { skip: -1 }, context, orderByArr),
    ).toThrow(
      "Invalid value for skip argument: Value can only be positive, found: -1",
    );
  });

  it("distinct はソート後の並びで適用される", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { distinct: "住所" },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "Henry",
      年齢: 28,
      住所: "Kyoto",
      郵便番号: "600-8001",
      職業: "Engineer",
    });
  });

  it("distinct 適用後の件数を skip が超えると null を返す（skip が先だと Eve になる）", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { distinct: "住所", skip: 3 },
      context,
      orderByArr,
    );

    expect(result).toBeNull();
  });

  it("take: -1 では反転後の並びで distinct する", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { take: -1, distinct: "住所", skip: 2 },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "David",
      年齢: 45,
      住所: "Kyoto",
      郵便番号: "600-8000",
      職業: "Manager",
    });
  });

  it("cursor 位置決めの後に skip する", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "Grace" }, skip: 1 },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "Frank",
      年齢: 52,
      住所: "Osaka",
      郵便番号: "550-0002",
      職業: "Director",
    });
  });

  it("take: -1 の cursor は反転後の並びで位置決めして skip する", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "David" }, take: -1, skip: 1 },
      context,
      orderByArr,
    );

    expect(result).toEqual({
      名前: "Eve",
      年齢: 28,
      住所: "Tokyo",
      郵便番号: "100-0003",
      職業: "Engineer",
    });
  });

  it("take: -1 と select を併用できる", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { take: -1, select: { 名前: true } },
      context,
      orderByArr,
    );

    expect(result).toEqual({ 名前: "Alice" });
  });
});
