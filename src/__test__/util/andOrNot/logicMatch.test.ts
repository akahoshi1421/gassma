import type { GassmaAny } from "../../../types/coreTypes";
import type { HitRowData } from "../../../types/hitRowDataType";
import { isLogicMatch } from "../../../util/andOrNot/entry";
import { isNotMatch } from "../../../util/andOrNot/not";
import { isOrMatch } from "../../../util/andOrNot/or";

describe("andOrNot の行番号照合", () => {
  const titles: GassmaAny[] = ["id", "name", "age"];
  const rows: HitRowData[] = [
    { rowNumber: 1, row: [1, "田中", 20] },
    { rowNumber: 2, row: [2, "佐藤", 30] },
    { rowNumber: 3, row: [3, "鈴木", 25] },
    { rowNumber: 4, row: [4, "高橋", 30] },
  ];

  describe("isOrMatch", () => {
    test("重複ヒットは除外され、先勝ちの順序で返す", () => {
      const result = isOrMatch(rows, [{ age: 30 }, { id: 2 }], titles);

      expect(result.map((r) => r.rowNumber)).toEqual([2, 4]);
    });

    test("後続の条件で新規ヒットした行は末尾に追加される", () => {
      const result = isOrMatch(rows, [{ id: 3 }, { age: 30 }], titles);

      expect(result.map((r) => r.rowNumber)).toEqual([3, 2, 4]);
    });

    test("3条件でも重複なく和集合になる", () => {
      const result = isOrMatch(
        rows,
        [{ age: 30 }, { id: 1 }, { age: { gte: 25 } }],
        titles,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([2, 4, 1, 3]);
    });

    test("返る要素は入力と同一の参照", () => {
      const result = isOrMatch(rows, [{ id: 2 }, { id: 4 }], titles);

      expect(result[0]).toBe(rows[1]);
      expect(result[1]).toBe(rows[3]);
    });
  });

  describe("isNotMatch", () => {
    test("条件にマッチした行を除いた補集合を元の順序で返す", () => {
      const result = isNotMatch(rows, [{ age: 30 }], titles);

      expect(result.map((r) => r.rowNumber)).toEqual([1, 3]);
    });

    test("複数条件は積集合の補集合になる", () => {
      const result = isNotMatch(rows, [{ age: 30 }, { id: 2 }], titles);

      expect(result.map((r) => r.rowNumber)).toEqual([1, 3, 4]);
    });

    test("何もマッチしなければ全行返す", () => {
      const result = isNotMatch(rows, [{ id: 999 }], titles);

      expect(result.map((r) => r.rowNumber)).toEqual([1, 2, 3, 4]);
    });
  });

  describe("isLogicMatch", () => {
    test("AND と OR の併用は積集合を OR 側の順序で返す", () => {
      const result = isLogicMatch(
        rows,
        { AND: [{ age: { gte: 25 } }], OR: [{ id: 1 }, { id: 2 }] },
        titles,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([2]);
    });

    test("AND と NOT の併用は積集合を NOT 側の順序で返す", () => {
      const result = isLogicMatch(
        rows,
        { AND: [{ age: { gte: 25 } }], NOT: [{ id: 4 }] },
        titles,
      );

      expect(result.map((r) => r.rowNumber)).toEqual([2, 3]);
    });

    test("OR のみなら OR の結果をそのまま返す", () => {
      const result = isLogicMatch(rows, { OR: [{ id: 3 }, { id: 1 }] }, titles);

      expect(result.map((r) => r.rowNumber)).toEqual([3, 1]);
    });
  });
});
