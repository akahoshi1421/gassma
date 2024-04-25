import { CreateData } from "../../types/createTypes";
import { UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getWantUpdateIndexFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  wantData: CreateData | UpdateData
): number[] => {
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

  const data = wantData.data;
  const titles = getTitle();

  const wantUpdateKeys = Object.entries(data).map((oneData) => {
    return oneData[0];
  });

  const wantUpdateIndex = wantUpdateKeys.map((key) => {
    return titles.findIndex((title) => {
      return title === key;
    });
  });

  return wantUpdateIndex;
};

export { getWantUpdateIndexFunc };
