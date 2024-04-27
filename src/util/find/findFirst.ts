import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getAllData } from "../core/getAllData";
import { getTitle } from "../core/getTitle";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { findedDataSelect } from "./findUtil/findDataSelect";

const findFirstFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData
) => {
  const where = "where" in findData ? findData.where : {};
  const select = "select" in findData ? findData.select : null;
  const skip = "skip" in findData ? findData.skip : null;

  let wantFindIndex: number[] = [];
  if (Object.keys(where).length !== 0)
    wantFindIndex = getWantFindIndex(gassmaControllerUtil, findData);

  let allDataList = getAllData(gassmaControllerUtil);
  const titles = getTitle(gassmaControllerUtil);

  if (skip)
    allDataList = allDataList.filter((_value, index) => index + 1 > skip);

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
