import { findManyFunc } from "../../../util/find/findMany";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

const names = (result: Record<string, unknown>[]): unknown[] =>
  result.map((r) => r["名前"]).sort();

describe("クエリを跨いで使い回した in 配列の in-place 変更", () => {
  test("同 length で書き換えた値が次のクエリに反映される(in)", () => {
    const addresses = ["Tokyo", "Kyoto"];

    const first = findManyFunc(getExtendedMockControllerUtil(), {
      where: { 住所: { in: addresses } },
    });
    expect(names(first)).toEqual([
      "Alice",
      "Charlie",
      "David",
      "Eve",
      "Grace",
      "Henry",
    ]);

    addresses[0] = "Osaka";

    const second = findManyFunc(getExtendedMockControllerUtil(), {
      where: { 住所: { in: addresses } },
    });
    expect(names(second)).toEqual(["Bob", "David", "Frank", "Henry"]);
  });

  test("同 length で書き換えた値が次のクエリに反映される(notIn)", () => {
    const addresses = ["Tokyo", "Kyoto"];

    const first = findManyFunc(getExtendedMockControllerUtil(), {
      where: { 住所: { notIn: addresses } },
    });
    expect(names(first)).toEqual(["Bob", "Frank"]);

    addresses[0] = "Osaka";

    const second = findManyFunc(getExtendedMockControllerUtil(), {
      where: { 住所: { notIn: addresses } },
    });
    expect(names(second)).toEqual(["Alice", "Charlie", "Eve", "Grace"]);
  });

  test("AND 内の in 配列の in-place 変更も次のクエリに反映される", () => {
    const addresses = ["Tokyo", "Kyoto"];

    const first = findManyFunc(getExtendedMockControllerUtil(), {
      where: { AND: [{ 住所: { in: addresses } }, { 年齢: { gte: 30 } }] },
    });
    expect(names(first)).toEqual(["David", "Grace"]);

    addresses[0] = "Osaka";

    const second = findManyFunc(getExtendedMockControllerUtil(), {
      where: { AND: [{ 住所: { in: addresses } }, { 年齢: { gte: 30 } }] },
    });
    expect(names(second)).toEqual(["Bob", "David", "Frank"]);
  });
});
