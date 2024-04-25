import { DeleteData, FindData, UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "./getTitle";

const getWantFindIndex = (
  gassmaControllerUtil: GassmaControllerUtil,
  wantData: FindData | DeleteData | UpdateData
) => {
  const where = wantData.where;
  const titles = getTitle(gassmaControllerUtil);

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

export { getWantFindIndex };
