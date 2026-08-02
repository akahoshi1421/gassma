import type { HitByClassificationedRowData } from "../../../../../../types/coreTypes";
import { normalHaving } from "../../../../../../util/groupby/groubyUtil/having/normalHavingFilter";

describe("normalHaving の集計結果と元グループの対応付け", () => {
  const by = ["住所"];
  const groups: HitByClassificationedRowData[] = [
    {
      rowNumber: 1,
      row: [
        { 住所: "Tokyo", 年齢: 20 },
        { 住所: "Tokyo", 年齢: 30 },
      ],
    },
    { rowNumber: 2, row: [{ 住所: "Kyoto", 年齢: 40 }] },
    { rowNumber: 3, row: [{ 住所: "Osaka", 年齢: 30 }] },
    { rowNumber: 4, row: [{ 住所: "Nagoya", 年齢: 10 }] },
  ];

  test("集計条件にマッチしたグループを入力順で返す", () => {
    const result = normalHaving(groups, { 年齢: { _avg: { gte: 30 } } }, by);

    expect(result.map((r) => r?.rowNumber)).toEqual([2, 3]);
  });

  test("返る要素は入力と同一の参照", () => {
    const result = normalHaving(groups, { 年齢: { _avg: { lte: 25 } } }, by);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(groups[0]);
    expect(result[1]).toBe(groups[3]);
  });

  test("マッチしなければ空配列を返す", () => {
    const result = normalHaving(groups, { 年齢: { _avg: { gte: 999 } } }, by);

    expect(result).toEqual([]);
  });

  test("by キーの等価条件と集計条件を併用できる", () => {
    const result = normalHaving(
      groups,
      { 住所: "Tokyo", 年齢: { _avg: { gte: 20 } } },
      by,
    );

    expect(result.map((r) => r?.rowNumber)).toEqual([1]);
  });
});
