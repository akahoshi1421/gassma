import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import {
  GassmaFindSelectOmitConflictError,
  GassmaSkipNegativeError,
} from "../../errors/find/findError";
import { getTitle } from "../core/getTitle";
import { whereFilter } from "../core/whereFilter";
import { findedDataSelect } from "./findUtil/findDataSelect";
import { omitFunc } from "./findUtil/omit";
import { orderByFunc } from "./findUtil/orderBy";

const findFirstFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData,
) => {
  const where = findData.where ?? {};
  const select = "select" in findData ? findData.select : null;
  const omit = "omit" in findData ? findData.omit : null;
  const orderBy = "orderBy" in findData ? findData.orderBy : null;
  const skip = "skip" in findData ? findData.skip : null;

  // Use whereFilter for consistent behavior with findMany
  const findedData = whereFilter(where, gassmaControllerUtil);
  const findedDataRowsOnly = findedData.map((row) => row.row);

  const titles = getTitle(gassmaControllerUtil);

  let findDataDictArray = findedDataRowsOnly.map((row) => {
    const result = {};
    row.forEach((data, dataIndex) => {
      result[titles[dataIndex]] = data;
    });

    return result;
  });

  // skip 負数バリデーション
  if (skip !== null && skip !== undefined && skip < 0) {
    throw new GassmaSkipNegativeError(skip);
  }

  // Apply skip if specified
  if (skip) findDataDictArray = findDataDictArray.slice(skip);

  // Apply orderBy if specified (before taking first)
  if (orderBy)
    findDataDictArray = orderByFunc(
      findDataDictArray,
      Array.isArray(orderBy) ? orderBy : [orderBy],
    );

  // Get the first result
  const firstResult = findDataDictArray[0];

  if (!firstResult) return null;

  if (select && omit) {
    throw new GassmaFindSelectOmitConflictError();
  }

  if (select) {
    return findedDataSelect(select, firstResult);
  }

  if (omit) {
    return omitFunc(omit, firstResult);
  }

  return firstResult;
};

export { findFirstFunc };
