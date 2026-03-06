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
import { applyCursor } from "./findUtil/applyCursor";

const findManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData,
) => {
  const where = findData.where ?? {};
  const select = "select" in findData ? findData.select : null;
  const omit = "omit" in findData ? findData.omit : null;
  const orderBy = "orderBy" in findData ? findData.orderBy : null;
  const take = "take" in findData ? findData.take : null;
  const skip = "skip" in findData ? findData.skip : null;
  const distinct = "distinct" in findData ? findData.distinct : null;

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

  // Apply orderBy first (before distinct, skip, take)
  if (orderBy)
    findDataDictArray = orderByFunc(
      findDataDictArray,
      Array.isArray(orderBy) ? orderBy : [orderBy],
    );

  // Apply distinct after orderBy
  if (distinct) {
    const distinctKeys = Array.isArray(distinct) ? distinct : [distinct];
    const seen = new Set<string>();

    findDataDictArray = findDataDictArray.filter((row) => {
      // Create a unique key from the distinct field values
      const key = distinctKeys.map((k) => JSON.stringify(row[k])).join("|");

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }

  // Apply cursor after orderBy + distinct, before skip/take
  const cursor = "cursor" in findData ? findData.cursor : null;
  if (cursor) {
    findDataDictArray = applyCursor(findDataDictArray, cursor, take);
  }

  // skip 負数バリデーション
  if (skip !== null && skip !== undefined && skip < 0) {
    throw new GassmaSkipNegativeError(skip);
  }

  // skip + take を一括処理
  if (take !== null && take !== undefined) {
    if (take === 0) {
      findDataDictArray = [];
    } else if (take > 0) {
      if (skip) findDataDictArray = findDataDictArray.slice(skip);
      findDataDictArray = findDataDictArray.slice(0, take);
    } else {
      // 負方向: skip は末尾から除外 → take は末尾から取得
      if (skip) findDataDictArray = findDataDictArray.slice(0, -skip);
      findDataDictArray = findDataDictArray.slice(take);
    }
  } else {
    if (skip) findDataDictArray = findDataDictArray.slice(skip);
  }

  if (select && omit) {
    throw new GassmaFindSelectOmitConflictError();
  }

  if (select) {
    const findDataDictArraySelected = findDataDictArray.map((row) => {
      return findedDataSelect(select, row);
    });
    return findDataDictArraySelected;
  }

  if (omit) {
    const findDataDictArrayOmitted = findDataDictArray.map((row) => {
      return omitFunc(omit, row);
    });
    return findDataDictArrayOmitted;
  }

  return findDataDictArray;
};

export { findManyFunc };
