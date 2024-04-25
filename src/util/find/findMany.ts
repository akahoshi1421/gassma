import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findedDataSelect } from "./findUtil/findDataSelect";

const findManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData
) => {
  const {
    sheet,
    startRowNumber,
    startColumNumber,
    endColumNumber,
    getTitle,
    getWantFindIndex,
    getWantUpdateIndex,
    allData,
  } = gassmaControllerUtil;

  const where = findData.where;
  const select = "select" in findData ? findData.select : null;

  const wantFindIndex = getWantFindIndex(findData);

  const allDataList = allData();
  const titles = getTitle();

  const findedDataIncludeNull = allDataList.map((row) => {
    const matchRow = wantFindIndex.filter((i) => {
      return row[i] === where[String(titles[i])];
    });

    if (matchRow.length === wantFindIndex.length) return row;

    return null;
  });

  const findedData = findedDataIncludeNull.filter((data) => data !== null);

  const findDataDictArray = findedData.map((row) => {
    const result = {};
    row.forEach((data, dataIndex) => {
      result[titles[dataIndex]] = data;
    });

    return result;
  });

  if (!select) return findDataDictArray;

  const findDataDictArraySelected = findDataDictArray.map((row) => {
    return findedDataSelect(select, row);
  });

  return findDataDictArraySelected;
};

export { findManyFunc };
