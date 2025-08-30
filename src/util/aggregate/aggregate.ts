import type { AggregateData } from "../../types/aggregateType";
import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findManyFunc } from "../find/findMany";
import { getAvg } from "./aggregateUtil/avg";
import { getCount } from "./aggregateUtil/count";
import { getMax } from "./aggregateUtil/max";
import { getMin } from "./aggregateUtil/min";
import { getSum } from "./aggregateUtil/sum";

const aggregateFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  aggregateData: AggregateData
) => {
  const where = "where" in aggregateData ? aggregateData.where : {};
  const orderBy = "orderBy" in aggregateData ? aggregateData.orderBy : null;
  const take = "take" in aggregateData ? aggregateData.take : null;
  const skip = "skip" in aggregateData ? aggregateData.skip : null;
  const avg = "_avg" in aggregateData ? aggregateData._avg : null;
  const count = "_count" in aggregateData ? aggregateData._count : null;
  const max = "_max" in aggregateData ? aggregateData._max : null;
  const min = "_min" in aggregateData ? aggregateData._min : null;
  const sum = "_sum" in aggregateData ? aggregateData._sum : null;

  const findData = {
    where: where,
  } as FindData;

  if (orderBy) findData.orderBy = orderBy;
  if (take) findData.take = take;
  if (skip) findData.skip = skip;

  const findedRows = findManyFunc(gassmaControllerUtil, findData);

  const aggregateResult = {};

  if (avg) aggregateResult["_avg"] = getAvg(findedRows, avg);
  if (count) aggregateResult["_count"] = getCount(findedRows, count);
  if (max) aggregateResult["_max"] = getMax(findedRows, max);
  if (min) aggregateResult["_min"] = getMin(findedRows, min);
  if (sum) aggregateResult["_sum"] = getSum(findedRows, sum);

  return aggregateResult;
};

export { aggregateFunc };
