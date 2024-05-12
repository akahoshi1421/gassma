import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { isLogicMatch } from "../andOrNot/entry";
import { getAllData } from "../core/getAllData";
import { getTitle } from "../core/getTitle";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";
import { findedDataSelect } from "./findUtil/findDataSelect";
import { orderByFunc } from "./findUtil/orderBy";

const findManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData
) => {
  const where = "where" in findData ? findData.where : {};
  const select = "select" in findData ? findData.select : null;
  const orderBy = "orderBy" in findData ? findData.orderBy : null;
  const take = "take" in findData ? findData.take : null;
  const skip = "skip" in findData ? findData.skip : null;

  let wantFindIndex: number[] = [];
  if (Object.keys(where).length !== 0)
    wantFindIndex = getWantFindIndex(gassmaControllerUtil, findData);

  const allDataList = getAllData(gassmaControllerUtil);
  const titles = getTitle(gassmaControllerUtil);

  const findedDataIncludeNull = allDataList.map((row) => {
    const matchRow = wantFindIndex.filter((i) => {
      const whereOptionContent = where[String(titles[i])];
      if (isDict(whereOptionContent))
        return isFilterConditionsMatch(row[i], whereOptionContent);

      return row[i] === whereOptionContent;
    });

    if (matchRow.length === wantFindIndex.length) return row;

    return null;
  });

  let findedData = findedDataIncludeNull.filter((data) => data !== null);

  if ("OR" in where || "AND" in where || "NOT" in where)
    findedData = isLogicMatch(findedData, where, titles, gassmaControllerUtil);

  let findDataDictArray = findedData.map((row) => {
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
