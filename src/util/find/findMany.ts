import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { GassmaFindSelectOmitConflictError } from "../../errors/find/findError";
import { getTitle } from "../core/getTitle";
import { whereFilter } from "../core/whereFilter";
import { findedDataSelect } from "./findUtil/findDataSelect";
import { omitFunc } from "./findUtil/omit";
import { orderByFunc } from "./findUtil/orderBy";

const findManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData
) => {
  const where = "where" in findData ? findData.where : {};
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

  if (skip)
    findDataDictArray = findDataDictArray.filter(
      (_value, index) => index + 1 > skip
    );

  if (take) findDataDictArray = findDataDictArray.slice(0, take);

  if (distinct) {
    const distinctArray = Array.isArray(distinct) ? distinct : [distinct];

    distinctArray.forEach((oneDistinct) => {
      const alreadySearched = [];
      findDataDictArray = findDataDictArray.filter((row) => {
        if (alreadySearched.includes(row[oneDistinct])) return false;

        alreadySearched.push(row[oneDistinct]);
        return true;
      });
    });
  }

  if (orderBy)
    findDataDictArray = orderByFunc(
      findDataDictArray,
      Array.isArray(orderBy) ? orderBy : [orderBy]
    );

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
