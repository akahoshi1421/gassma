import type { FilterConditions, GassmaAny } from "../../../types/coreTypes";
import { filterRowsByWhere } from "../../../util/core/filterRowsByWhere";
import { FieldRef } from "../../../util/filterConditions/fieldRef";

const fc = (obj: Record<string, unknown>) => obj as FilterConditions;

describe("filterRowsByWhere", () => {
  const titles = ["id", "name", "age", "authorId"];
  const rows: GassmaAny[][] = [
    [1, "田中", 20, null],
    [2, "佐藤", 30, 1],
    [3, "鈴木", 25, 1],
    [4, null, 40, 2],
  ];

  it("空 where は全行を rowNumber 付きで返す", () => {
    const result = filterRowsByWhere(rows, titles, {});
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ rowNumber: 1, row: rows[0] });
    expect(result[3]).toEqual({ rowNumber: 4, row: rows[3] });
  });

  it("単一カラム等価でマッチ行のみ返す", () => {
    const result = filterRowsByWhere(rows, titles, { id: 2 });
    expect(result).toEqual([{ rowNumber: 2, row: rows[1] }]);
  });

  it("複数カラムは AND で絞り込む", () => {
    const result = filterRowsByWhere(rows, titles, { authorId: 1, age: 25 });
    expect(result).toEqual([{ rowNumber: 3, row: rows[2] }]);
  });

  it("空文字は null として扱う", () => {
    const result = filterRowsByWhere(rows, titles, { name: "" });
    expect(result).toEqual([{ rowNumber: 4, row: rows[3] }]);
  });

  it("フィルタ条件 (gt) が使える", () => {
    const result = filterRowsByWhere(rows, titles, { age: { gt: 25 } });
    expect(result.map((r) => r.rowNumber)).toEqual([2, 4]);
  });

  it("titles に無いキーは無視され全行マッチする", () => {
    const result = filterRowsByWhere(rows, titles, { ghost: 99 });
    expect(result).toHaveLength(4);
  });

  it("OR で和集合を返す", () => {
    const result = filterRowsByWhere(rows, titles, {
      OR: [{ id: 1 }, { id: 3 }],
    });
    expect(result.map((r) => r.rowNumber)).toEqual([1, 3]);
  });

  it("AND 配列で積集合を返す", () => {
    const result = filterRowsByWhere(rows, titles, {
      AND: [{ authorId: 1 }, { age: { gte: 30 } }],
    });
    expect(result.map((r) => r.rowNumber)).toEqual([2]);
  });

  it("NOT で除外する", () => {
    const result = filterRowsByWhere(rows, titles, {
      NOT: [{ authorId: 1 }],
    });
    expect(result.map((r) => r.rowNumber)).toEqual([1, 4]);
  });

  it("通常キーと OR の組み合わせで両方適用される", () => {
    const result = filterRowsByWhere(rows, titles, {
      authorId: 1,
      OR: [{ age: 25 }, { age: 30 }],
    });
    expect(result.map((r) => r.rowNumber).sort()).toEqual([2, 3]);
  });

  it("FieldRef で他カラム参照比較ができる", () => {
    const refTitles = ["id", "score", "limit"];
    const refRows: GassmaAny[][] = [
      [1, 10, 5],
      [2, 3, 5],
    ];
    const result = filterRowsByWhere(refRows, refTitles, {
      score: fc({ gt: new FieldRef("Model", "limit") }),
    });
    expect(result.map((r) => r.rowNumber)).toEqual([1]);
  });

  it("空テーブルではどの where でも空を返す", () => {
    expect(filterRowsByWhere([], titles, { id: 1 })).toEqual([]);
    expect(filterRowsByWhere([], titles, {})).toEqual([]);
  });
});
