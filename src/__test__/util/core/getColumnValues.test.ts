import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import { getColumnValues } from "../../../util/core/getColumnValues";

type RangeCall = [number, number, number, number];

const makeSheet = (data: unknown[][]) => {
  const calls: RangeCall[] = [];
  const sheet = {
    getName: () => "Users",
    getLastRow: () => data.length,
    getLastColumn: () => (data[0] ? data[0].length : 0),
    getRange: (row: number, col: number, numRows: number, numCols: number) => {
      calls.push([row, col, numRows, numCols]);
      return {
        getValues: () =>
          data
            .slice(row - 1, row - 1 + numRows)
            .map((r) => r.slice(col - 1, col - 1 + numCols)),
      };
    },
  };
  return { sheet, calls };
};

const utilOf = (
  sheet: ReturnType<typeof makeSheet>["sheet"],
  endColumnNumber: number,
  fieldMapping?: Record<string, string>,
): GassmaControllerUtil => {
  const util: GassmaControllerUtil = {
    sheet: sheet as any,
    startRowNumber: 1,
    startColumnNumber: 1,
    endColumnNumber,
  };
  if (fieldMapping) util.fieldMapping = fieldMapping;
  return util;
};

const rows: unknown[][] = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

describe("getColumnValues", () => {
  it("指定フィールドの列の値を返す", () => {
    const { sheet } = makeSheet(rows);
    expect(getColumnValues(utilOf(sheet, 3), "id")).toEqual([1, 2]);
  });

  it("見出し行と対象の1列しか読まない", () => {
    const { sheet, calls } = makeSheet(rows);
    getColumnValues(utilOf(sheet, 3), "age");
    expect(calls).toEqual([
      [1, 1, 1, 3],
      [2, 3, 2, 1],
    ]);
  });

  it("存在しないフィールドなら null を返し列は読まない", () => {
    const { sheet, calls } = makeSheet(rows);
    expect(getColumnValues(utilOf(sheet, 3), "nope")).toBeNull();
    expect(calls).toEqual([[1, 1, 1, 3]]);
  });

  it("データ行が無ければ空配列", () => {
    const { sheet } = makeSheet([["id", "name", "age"]]);
    expect(getColumnValues(utilOf(sheet, 3), "id")).toEqual([]);
  });

  it("map のコード名で列を解決する", () => {
    const { sheet } = makeSheet(rows);
    expect(
      getColumnValues(utilOf(sheet, 3, { userAge: "age" }), "userAge"),
    ).toEqual([20, 30]);
  });

  it("map 適用後はシート上の生の列名では解決しない", () => {
    const { sheet } = makeSheet(rows);
    expect(
      getColumnValues(utilOf(sheet, 3, { userAge: "age" }), "age"),
    ).toBeNull();
  });
});
