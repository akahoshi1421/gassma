import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { whereFilter } from "../core/whereFilter";
import { findedDataSelect } from "./findUtil/findDataSelect";
import { orderByFunc } from "./findUtil/orderBy";

const findManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData
) => {
  const where = "where" in findData ? findData.where : {};
  const join = "join" in findData ? findData.join : null;
  const select = "select" in findData ? findData.select : null;
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

  if (!select) return findDataDictArray;

  const findDataDictArraySelected = findDataDictArray.map((row) => {
    return findedDataSelect(select, row);
  });

  return findDataDictArraySelected;
};

export { findManyFunc };
