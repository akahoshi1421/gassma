import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findedDataSelect } from "./findUtil/findDataSelect";

const findFirstFunc = (
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

  const findedData = allDataList.find((row) => {
    const matchRow = wantFindIndex.filter((i) => {
      return row[i] === where[String(titles[i])];
    });

    return matchRow.length === wantFindIndex.length;
  });

  if (!findedData) return null;

  const findedDataDict = {};

  findedData.forEach((data, dataIndex) => {
    findedDataDict[titles[dataIndex]] = data;
  });

  if (!select) return findedDataDict;

  return findedDataSelect(select, findedDataDict);
};

export { findFirstFunc };
