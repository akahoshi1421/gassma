import type { HitByClassificationedRowData } from "../../../../../types/coreTypes";
import { isLogicMatchHaving } from "../../../../../util/groupby/groubyUtil/andOrNot/entry";
import { isNotMatchHaving } from "../../../../../util/groupby/groubyUtil/andOrNot/not";
import { isOrMatchHaving } from "../../../../../util/groupby/groubyUtil/andOrNot/or";

describe("groupBy having の行番号照合", () => {
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

  describe("isOrMatchHaving", () => {
    test("重複ヒットは除外され、新規ヒットのみ末尾に追加される", () => {
      const result = isOrMatchHaving(
        groups,
        [{ 年齢: { _avg: { gte: 30 } } }, { 年齢: { _avg: { gte: 25 } } }],
        by,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([2, 3, 1]);
    });

    test("返る要素は入力と同一の参照", () => {
      const result = isOrMatchHaving(
        groups,
        [{ 年齢: { _avg: { gte: 40 } } }, { 年齢: { _avg: { lte: 10 } } }],
        by,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(groups[1]);
      expect(result[1]).toBe(groups[3]);
    });
  });

  describe("isNotMatchHaving", () => {
    test("条件にマッチしたグループを除いた補集合を元の順序で返す", () => {
      const result = isNotMatchHaving(
        groups,
        [{ 年齢: { _avg: { gte: 30 } } }],
        by,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([1, 4]);
    });

    test("何もマッチしなければ全グループ返す", () => {
      const result = isNotMatchHaving(
        groups,
        [{ 年齢: { _avg: { gte: 999 } } }],
        by,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([1, 2, 3, 4]);
    });
  });

  describe("isLogicMatchHaving", () => {
    test("AND と OR の併用は積集合を OR 側の順序で返す", () => {
      const result = isLogicMatchHaving(
        groups,
        {
          AND: [{ 年齢: { _avg: { gte: 25 } } }],
          OR: [{ 年齢: { _avg: { lte: 30 } } }],
        },
        by,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([1, 3]);
    });

    test("AND と NOT の併用は積集合を NOT 側の順序で返す", () => {
      const result = isLogicMatchHaving(
        groups,
        {
          AND: [{ 年齢: { _avg: { gte: 25 } } }],
          NOT: [{ 年齢: { _avg: { gte: 40 } } }],
        },
        by,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([1, 3]);
    });
  });
});
