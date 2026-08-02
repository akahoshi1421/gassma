import { getStringMax } from "../../../../util/aggregate/aggregateUtil/max/stringMax";
import { getStringMin } from "../../../../util/aggregate/aggregateUtil/min/stringMin";

describe("getStringMax / getStringMin のタイブレーク", () => {
  test("max: 同一文字列が複数あっても正しく返す", () => {
    expect(getStringMax(["same", "same", "same"])).toBe("same");
  });

  test("min: 同一文字列が複数あっても正しく返す", () => {
    expect(getStringMin(["same", "same", "same"])).toBe("same");
  });

  test("max: 前方一致のタイでは長い方が勝つ", () => {
    expect(getStringMax(["ab", "abc", "a"])).toBe("abc");
  });

  test("min: 前方一致のタイでは短い方が勝つ", () => {
    expect(getStringMin(["abc", "ab", "abcd"])).toBe("ab");
  });

  test("max: 長いタイ集合でも最後の1文字で決まる", () => {
    expect(getStringMax(["prefix-a", "prefix-c", "prefix-b"])).toBe("prefix-c");
  });

  test("min: 長いタイ集合でも最後の1文字で決まる", () => {
    expect(getStringMin(["prefix-b", "prefix-a", "prefix-c"])).toBe("prefix-a");
  });

  test("max: タイ集合と無関係な行の同値文字が混ざっても影響しない", () => {
    expect(getStringMax(["zb", "az", "zc", "az"])).toBe("zc");
  });

  test("min: タイ集合と無関係な行の同値文字が混ざっても影響しない", () => {
    expect(getStringMin(["ab", "za", "ac", "za"])).toBe("ab");
  });
});
