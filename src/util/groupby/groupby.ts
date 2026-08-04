import type { RowRecord, Select } from "../../types/coreTypes";
import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { GroupByData } from "../../types/groupByType";
import { getAvg } from "../aggregate/aggregateUtil/avg";
import { getCount } from "../aggregate/aggregateUtil/count";
import { getMax } from "../aggregate/aggregateUtil/max";
import { getMin } from "../aggregate/aggregateUtil/min";
import { getSum } from "../aggregate/aggregateUtil/sum";
import { findManyFunc } from "../find/findMany";
import {
  buildValidatedCountSelect,
  buildValidatedFieldSelect,
} from "../validate/buildValidatedAggregateSelect";
import { validateFiniteNumberOption } from "../validate/validateFiniteNumberOption";
import { byClassification } from "./groubyUtil/by";
import { orderGroups } from "./groubyUtil/groupOrderBy";
import {
  buildGroupSortKeys,
  getAvailableFields,
  toOrderByArray,
} from "./groubyUtil/groupOrderByKeys";
import {
  applyGroupSkipTake,
  ensurePaginationOrderBy,
} from "./groubyUtil/groupPagination";
import { havingFilter } from "./groubyUtil/having";

const groupByFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  groupByData: GroupByData,
) => {
  const where = groupByData.where || {};
  const orderByArr = toOrderByArray(groupByData.orderBy);
  const take = "take" in groupByData ? groupByData.take : null;
  validateFiniteNumberOption("take", take);
  validateFiniteNumberOption("skip", groupByData.skip);
  const skip = groupByData.skip || null;
  const validateFieldSelect = (value: Select | null | undefined) =>
    typeof value === "object" && value !== null
      ? buildValidatedFieldSelect(gassmaControllerUtil, value)
      : value || null;

  const avg = validateFieldSelect(groupByData._avg);
  const rawCount = groupByData._count ?? null;
  const count =
    typeof rawCount === "object" && rawCount !== null
      ? buildValidatedCountSelect(gassmaControllerUtil, rawCount)
      : rawCount;
  const max = validateFieldSelect(groupByData._max);
  const min = validateFieldSelect(groupByData._min);
  const sum = validateFieldSelect(groupByData._sum);
  const by = Array.isArray(groupByData.by) ? groupByData.by : [groupByData.by];
  const having = groupByData.having || null;

  const sortKeys = buildGroupSortKeys(orderByArr, by, () =>
    getAvailableFields(gassmaControllerUtil),
  );
  ensurePaginationOrderBy(orderByArr, take, skip);

  const findData: FindData = {
    where: where,
  };

  const findedRows = findManyFunc(gassmaControllerUtil, findData);

  let byClassificationed = byClassification(findedRows, by) as RowRecord[][];

  if (having) byClassificationed = havingFilter(byClassificationed, having, by);

  const groupByResult = byClassificationed.map((oneClass) => {
    const oneClassFirst = oneClass[0];

    const oneLineResult: any = {};

    by.forEach((oneBy) => {
      oneLineResult[oneBy] = oneClassFirst[oneBy];
    });
    return oneLineResult;
  });

  byClassificationed.forEach((oneClass, index) => {
    if (avg) {
      const avgData = getAvg(oneClass, avg);
      groupByResult[index]._avg = avgData;
    }
    if (count) {
      const countData = getCount(oneClass, count);
      groupByResult[index]._count = countData;
    }
    if (max) {
      const maxData = getMax(oneClass, max);
      groupByResult[index]._max = maxData;
    }
    if (min) {
      const minData = getMin(oneClass, min);
      groupByResult[index]._min = minData;
    }
    if (sum) {
      const sumData = getSum(oneClass, sum);
      groupByResult[index]._sum = sumData;
    }
  });

  const orderedResult = orderGroups(
    byClassificationed,
    groupByResult,
    sortKeys,
  );

  return applyGroupSkipTake(orderedResult, skip, take);
};

export { groupByFunc };
