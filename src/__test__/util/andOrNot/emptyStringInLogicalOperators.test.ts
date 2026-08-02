import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import { findManyFunc } from "../../../util/find/findMany";

// 名前=A はメモあり、B は空文字セル、C も空セル(読み取り時にどちらも null 化される)
const makeMock = (): GassmaControllerUtil => ({
  sheet: {
    getDataRange: () =>
      ({
        getValues: () => [
          ["名前", "メモ"],
          ["A", "hello"],
          ["B", ""],
          ["C", ""],
        ],
      }) as any,
    getLastRow: () => 4,
    getLastColumn: () => 2,
    getRange: (
      row: number,
      _col: number,
      numRows: number,
      _numCols: number,
    ) => {
      if (row === 1 && numRows === 1) {
        return { getValues: () => [["名前", "メモ"]] } as any;
      }
      return {
        getValues: () => [
          ["A", "hello"],
          ["B", ""],
          ["C", ""],
        ],
      } as any;
    },
  } as any,
  startRowNumber: 1,
  startColumnNumber: 1,
  endColumnNumber: 2,
});

const names = (rows: Record<string, unknown>[]) => rows.map((row) => row.名前);

describe("論理演算子の中の空文字はトップレベルと同じく null 扱い", () => {
  test("トップレベルの メモ: '' は空セル行にマッチ", () => {
    const result = findManyFunc(makeMock(), { where: { メモ: "" } });
    expect(names(result)).toEqual(["B", "C"]);
  });

  test("AND: [{ メモ: '' }] はトップレベルと同じ結果", () => {
    const result = findManyFunc(makeMock(), { where: { AND: [{ メモ: "" }] } });
    expect(names(result)).toEqual(["B", "C"]);
  });

  test("AND: { メモ: '' } (オブジェクト形式) も同じ結果", () => {
    const result = findManyFunc(makeMock(), { where: { AND: { メモ: "" } } });
    expect(names(result)).toEqual(["B", "C"]);
  });

  test("OR: [{ メモ: '' }] はトップレベルと同じ結果", () => {
    const result = findManyFunc(makeMock(), { where: { OR: [{ メモ: "" }] } });
    expect(names(result)).toEqual(["B", "C"]);
  });

  test("OR: [{ メモ: '' }, { 名前: 'A' }] は全行", () => {
    const result = findManyFunc(makeMock(), {
      where: { OR: [{ メモ: "" }, { 名前: "A" }] },
    });
    expect(names(result)).toEqual(["B", "C", "A"]);
  });

  test("NOT: { メモ: '' } は空セル行の補集合", () => {
    const result = findManyFunc(makeMock(), { where: { NOT: { メモ: "" } } });
    expect(names(result)).toEqual(["A"]);
  });

  test("NOT: [{ メモ: '' }] も同じ結果", () => {
    const result = findManyFunc(makeMock(), { where: { NOT: [{ メモ: "" }] } });
    expect(names(result)).toEqual(["A"]);
  });

  test("ネストした OR > AND の中の '' も同じ結果", () => {
    const result = findManyFunc(makeMock(), {
      where: { OR: [{ AND: [{ メモ: "" }] }] },
    });
    expect(names(result)).toEqual(["B", "C"]);
  });

  test("AND: [{ メモ: { equals: '' } }] も同じ結果", () => {
    const result = findManyFunc(makeMock(), {
      where: { AND: [{ メモ: { equals: "" } }] },
    });
    expect(names(result)).toEqual(["B", "C"]);
  });
});
