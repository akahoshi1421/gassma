import type { FindFirstData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { GassmaFindSelectOmitConflictError } from "../../errors/find/findError";
import { getTitle } from "../core/getTitle";
import { whereFilter } from "../core/whereFilter";
import { findedDataSelect } from "./findUtil/findDataSelect";
import { omitFunc } from "./findUtil/omit";
import { orderByFunc } from "./findUtil/orderBy";
import { applyCursor } from "./findUtil/applyCursor";
import { applyDistinct } from "./findUtil/applyDistinct";
import { applyFindFirstTake } from "./findUtil/applyFindFirstTake";
import { applySkipTake } from "./findUtil/applySkipTake";

const findFirstFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindFirstData,
) => {
  const where = findData.where ?? {};
  const select = "select" in findData ? findData.select : null;
  const omit = "omit" in findData ? findData.omit : null;
  const orderBy = "orderBy" in findData ? findData.orderBy : null;
  const take = "take" in findData ? findData.take : null;
  const skip = "skip" in findData ? findData.skip : null;
  const distinct = "distinct" in findData ? findData.distinct : null;

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

  // 適用順は Prisma 実測: orderBy → take(-1 で反転) → cursor → distinct → skip → 先頭
  if (orderBy)
    findDataDictArray = orderByFunc(
      findDataDictArray,
      Array.isArray(orderBy) ? orderBy : [orderBy],
    );

  findDataDictArray = applyFindFirstTake(findDataDictArray, take);

  const cursor = "cursor" in findData ? findData.cursor : null;
  if (cursor) {
    findDataDictArray = applyCursor(findDataDictArray, cursor, null);
  }

  if (distinct) {
    findDataDictArray = applyDistinct(findDataDictArray, distinct);
  }

  findDataDictArray = applySkipTake(findDataDictArray, skip, null);

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
