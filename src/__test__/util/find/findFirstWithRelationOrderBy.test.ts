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

describe("findFirstWithRelationOrderBy cursor", () => {
  const mockUtil = getExtendedMockControllerUtil();
  const context = createRelationContext();

  it("cursor なしはソート後の先頭を返す", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      {},
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

  it("cursor 行自身を返す（inclusive）", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "Eve" } },
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

  it("relation orderBy 適用後の並びで cursor を探す", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { cursor: { 住所: "Tokyo" } },
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

  it("cursor が一致しない場合は null を返す", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "Zoe" } },
      context,
      orderByArr,
    );

    expect(result).toBeNull();
  });

  it("select と併用できる", () => {
    const result = findFirstWithRelationOrderBy(
      mockUtil,
      { cursor: { 名前: "Eve" }, select: { 名前: true } },
      context,
      orderByArr,
    );

    expect(result).toEqual({ 名前: "Eve" });
  });
});
