import { AggregateData } from "../../types/aggregateType";
import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findManyFunc } from "../find/findMany";

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

  const result = {};

  if (avg) {
  }
};
