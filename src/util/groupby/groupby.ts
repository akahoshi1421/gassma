import { GassmaAny } from "../../types/coreTypes";
import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { GroupByData } from "../../types/groupByType";
import { getAvg } from "../aggregate/aggregateUtil/avg";
import { getCount } from "../aggregate/aggregateUtil/count";
import { getMax } from "../aggregate/aggregateUtil/max";
import { getMin } from "../aggregate/aggregateUtil/min";
import { getSum } from "../aggregate/aggregateUtil/sum";
import { findManyFunc } from "../find/findMany";
import { byClassification } from "./groubyUtil/by";
import { havingFilter } from "./groubyUtil/having";

const groupByFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  groupByData: GroupByData
) => {
  const where = groupByData.where || {};
  const orderBy = groupByData.orderBy || null;
  const take = groupByData.take || null;
  const skip = groupByData.skip || null;
  const avg = groupByData._avg || null;
  const count = groupByData._count || null;
  const max = groupByData._max || null;
  const min = groupByData._min || null;
  const sum = groupByData._sum || null;
  const by = Array.isArray(groupByData.by) ? groupByData.by : [groupByData.by];
  const having = groupByData.having || null;

  const findData: FindData = {
    where: where,
  };

  if (orderBy) findData.orderBy = orderBy;
  if (take) findData.take = take;
  if (skip) findData.skip = skip;

  const findedRows = findManyFunc(gassmaControllerUtil, findData);

  const byClassificationed = byClassification(findedRows, by) as {}[][];

  if (having) havingFilter(byClassificationed, having);

  const groupByResult = byClassificationed.map((oneClass) => {
    const oneClassFirst = oneClass[0];

    const oneLineResult = {};

    by.forEach((oneBy) => (oneLineResult[oneBy] = oneClassFirst[oneBy]));
    return oneLineResult;
  });

  byClassificationed.forEach((oneClass, index) => {
    if (avg) {
      const avgData = getAvg(oneClass, avg);
      groupByResult[index]["_avg"] = avgData;
    }
    if (count) {
      const countData = getCount(oneClass, count);
      groupByResult[index]["_count"] = countData;
    }
    if (max) {
      const maxData = getMax(oneClass, max);
      groupByResult[index]["_max"] = maxData;
    }
    if (min) {
      const minData = getMin(oneClass, min);
      groupByResult[index]["_min"] = minData;
    }
    if (sum) {
      const sumData = getSum(oneClass, sum);
      groupByResult[index]["_sum"] = sumData;
    }
  });
};

export { groupByFunc };
