import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import { aggregateFunc } from "../../../util/aggregate/aggregate";
import { groupByFunc } from "../../../util/groupby/groupby";
import { expectArrayToEqualIgnoringOrder } from "../../helpers/matchers";

const getNanMockControllerUtil = (): GassmaControllerUtil => {
  const data = [
    ["id", "名前", "年齢"],
    [1, "Alice", 20],
    [2, "Bob", 30],
    [9, "FromForm", NaN],
    [10, "FromForm2", NaN],
  ];

  return {
    sheet: {
      getDataRange: () => ({
        getValues: () => data.map((row) => [...row]),
      }),
      getLastRow: () => data.length,
      getLastColumn: () => 3,
      getRange: (row: number, _col: number, numRows: number) => ({
        getValues: () =>
          row === 1 && numRows === 1
            ? [[...data[0]]]
            : data.slice(1).map((dataRow) => [...dataRow]),
      }),
    } as any,
    startRowNumber: 1,
    startColumnNumber: 1,
    endColumnNumber: 3,
  };
};

describe("groupBy with NaN values", () => {
  test("NaN rows form a single group instead of crashing", () => {
    const result = groupByFunc(getNanMockControllerUtil(), { by: "年齢" });

    expectArrayToEqualIgnoringOrder(result, [
      { 年齢: 20 },
      { 年齢: 30 },
      { 年齢: NaN },
    ]);
  });

  test("NaN rows are not dropped when NaN column is not the last by column", () => {
    const result = groupByFunc(getNanMockControllerUtil(), {
      by: ["年齢", "名前"],
    });

    expectArrayToEqualIgnoringOrder(result, [
      { 年齢: 20, 名前: "Alice" },
      { 年齢: 30, 名前: "Bob" },
      { 年齢: NaN, 名前: "FromForm" },
      { 年齢: NaN, 名前: "FromForm2" },
    ]);
  });

  test("aggregates inside groupBy ignore NaN", () => {
    const result = groupByFunc(getNanMockControllerUtil(), {
      by: "名前",
      _count: { _all: true, 年齢: true },
    });

    expectArrayToEqualIgnoringOrder(result, [
      { 名前: "Alice", _count: { _all: 1, 年齢: 1 } },
      { 名前: "Bob", _count: { _all: 1, 年齢: 1 } },
      { 名前: "FromForm", _count: { _all: 1, 年齢: 0 } },
      { 名前: "FromForm2", _count: { _all: 1, 年齢: 0 } },
    ]);
  });

  test("having still filters groups when NaN rows exist", () => {
    const result = groupByFunc(getNanMockControllerUtil(), {
      by: "年齢",
      having: { 年齢: { _min: { gte: 25 } } },
    });

    expect(result).toEqual([{ 年齢: 30 }]);
  });
});

describe("aggregate with NaN values", () => {
  test("_max/_min/_sum/_avg ignore NaN rows", () => {
    const result = aggregateFunc(getNanMockControllerUtil(), {
      _max: { 年齢: true },
      _min: { 年齢: true },
      _sum: { 年齢: true },
      _avg: { 年齢: true },
    });

    expect(result).toEqual({
      _max: { 年齢: 30 },
      _min: { 年齢: 20 },
      _sum: { 年齢: 50 },
      _avg: { 年齢: 25 },
    });
  });

  test("_count counts NaN as missing for the field but keeps the row in _all", () => {
    const result = aggregateFunc(getNanMockControllerUtil(), {
      _count: { _all: true, 年齢: true },
    });

    expect(result).toEqual({
      _count: { _all: 4, 年齢: 2 },
    });
  });
});
