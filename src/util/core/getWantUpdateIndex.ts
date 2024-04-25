import { CreateData } from "../../types/createTypes";
import { UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "./getTitle";

const getWantUpdateIndex = (
  gassmaControllerUtil: GassmaControllerUtil,
  wantData: CreateData | UpdateData
): number[] => {
  const data = wantData.data;
  const titles = getTitle(gassmaControllerUtil);

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

export { getWantUpdateIndex };
