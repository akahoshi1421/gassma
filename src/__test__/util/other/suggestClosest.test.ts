import { suggestClosest } from "../../../util/other/suggestClosest";

describe("suggestClosest", () => {
  test("1文字の挿入 typo は最も近い候補を返す", () => {
    expect(suggestClosest("whre", ["where", "limit"])).toBe("where");
  });

  test("1文字の転置 typo も候補を返す", () => {
    expect(suggestClosest("gth", ["equals", "gt", "gte", "lt"])).toBe("gt");
  });

  test("日本語の列名でも文字単位の距離で候補を返す", () => {
    expect(
      suggestClosest("名まえ", ["名前", "年齢", "住所", "郵便番号", "職業"]),
    ).toBe("名前");
  });

  test("どの候補からも遠い入力は null を返す", () => {
    expect(suggestClosest("foobarbaz", ["where", "limit"])).toBeNull();
  });

  test("全文字が異なる短い入力は距離が小さくても null を返す", () => {
    expect(suggestClosest("xyz", ["gt", "lt"])).toBeNull();
  });

  test("候補が空なら null を返す", () => {
    expect(suggestClosest("whre", [])).toBeNull();
  });

  test("距離が同じ場合は先頭の候補を返す", () => {
    expect(suggestClosest("gtx", ["gte", "gta"])).toBe("gte");
  });
});
