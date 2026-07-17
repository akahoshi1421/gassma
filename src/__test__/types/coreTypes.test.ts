import type { HavingCore } from "../../types/coreTypes";
import type { GroupByData } from "../../types/groupByType";

describe("HavingCore aggregate filter types", () => {
  test("should accept number FilterConditions for _count/_avg/_sum", () => {
    const havingCore: HavingCore = {
      _count: { gt: 2, gte: 3, lt: 10, lte: 9, not: 0 },
      _avg: { equals: null, gte: 1.5 },
      _sum: { in: [1, 2], notIn: [3], equals: 100 },
    };

    expect(havingCore).toBeDefined();
  });

  test("should accept _count having on string field via GroupByData", () => {
    const groupByData: GroupByData = {
      by: "住所",
      having: { 郵便番号: { _count: { gt: 2 } } },
      _count: { 郵便番号: true },
    };

    expect(groupByData).toBeDefined();
  });

  test("should keep field-value FilterConditions for _min/_max", () => {
    const havingCore: HavingCore = {
      _min: { contains: "a", mode: "insensitive" },
      _max: { startsWith: "b", endsWith: "c", gte: "x" },
    };

    expect(havingCore).toBeDefined();
  });

  test("should reject string operators and string values for _count/_avg/_sum", () => {
    // @ts-expect-error _count は件数（数値）なので contains は指定できない
    const countContains: HavingCore = { _count: { contains: "a" } };

    // @ts-expect-error _count は件数（数値）なので文字列値は指定できない
    const countStringGt: HavingCore = { _count: { gt: "a" } };

    // @ts-expect-error _avg は数値なので startsWith は指定できない
    const avgStartsWith: HavingCore = { _avg: { startsWith: "a" } };

    // @ts-expect-error _sum は数値なので文字列の in は指定できない
    const sumStringIn: HavingCore = { _sum: { in: ["a"] } };

    expect(countContains).toBeDefined();
    expect(countStringGt).toBeDefined();
    expect(avgStartsWith).toBeDefined();
    expect(sumStringIn).toBeDefined();
  });
});
