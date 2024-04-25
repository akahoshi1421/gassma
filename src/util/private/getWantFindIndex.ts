import { DeleteData, FindData, UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getWantFindIndexFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  wantData: FindData | DeleteData | UpdateData
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

  const where = wantData.where;
  const titles = getTitle();

  const wantFindKeys = Object.entries(where).map((oneData) => {
    return oneData[0];
  });

  const wantFindIndex = wantFindKeys.map((key) => {
    return titles.findIndex((title) => {
      return title === key;
    });
  });

  return wantFindIndex;
};

export { getWantFindIndexFunc };
