import type { RowRecord, Select } from "../../../types/coreTypes";
import { getAvg } from "../../aggregate/aggregateUtil/avg";
import { getCount } from "../../aggregate/aggregateUtil/count";
import { getMax } from "../../aggregate/aggregateUtil/max";
import { getMin } from "../../aggregate/aggregateUtil/min";
import { getSum } from "../../aggregate/aggregateUtil/sum";
import { buildOrderByComparator } from "../../find/findUtil/orderBy";
import { isDict } from "../../other/isDict";
import type { GroupSortKey } from "./groupOrderByKeys";

const AGGREGATE_GETTERS: Record<
  string,
  (rows: Record<string, any>[], select: Select) => unknown
> = {
  _avg: getAvg,
  _count: getCount,
  _max: getMax,
  _min: getMin,
  _sum: getSum,
};

const readAggregateField = (computed: unknown, field: string): unknown => {
  if (isDict(computed)) return computed[field];
  return null;
};

const aggregateSortValue = (
  aggregate: string,
  rows: RowRecord[],
  field: string,
): unknown => {
  const computed = AGGREGATE_GETTERS[aggregate](rows, { [field]: true });
  return readAggregateField(computed, field);
};

const buildSortRow = (
  rows: RowRecord[],
  result: Record<string, unknown>,
  sortKeys: GroupSortKey[],
): Record<string, unknown> => {
  const sortRow: Record<string, unknown> = {};

  sortKeys.forEach((sortKey) => {
    sortRow[sortKey.key] =
      sortKey.aggregate === null
        ? result[sortKey.field]
        : aggregateSortValue(sortKey.aggregate, rows, sortKey.field);
  });

  return sortRow;
};

const orderGroups = (
  groups: RowRecord[][],
  results: Record<string, unknown>[],
  sortKeys: GroupSortKey[],
): Record<string, unknown>[] => {
  if (sortKeys.length === 0) return results;

  const comparator = buildOrderByComparator(
    sortKeys.map((sortKey) => ({ [sortKey.key]: sortKey.value })),
  );

  const decoratedGroups = results.map((result, index) => ({
    result: result,
    sortRow: buildSortRow(groups[index], result, sortKeys),
  }));

  decoratedGroups.sort((a, b) => comparator(a.sortRow, b.sortRow));

  return decoratedGroups.map((decoratedGroup) => decoratedGroup.result);
};

export { orderGroups };
