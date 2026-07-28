import type { GassmaAny, WhereUse } from "../../types/coreTypes";
import type { DeleteData, FindData, UpdateData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "./getTitle";

const getWantFindIndexFromTitles = (
  titles: GassmaAny[],
  where: WhereUse,
): number[] => {
  const wantFindKeys = Object.entries(where).map((oneData) => {
    return oneData[0];
  });

  const wantFindIndex = wantFindKeys.map((key) => {
    if (key === "AND" || key === "OR" || key === "NOT") return -1;

    return titles.indexOf(key);
  });

  const wantFindIndexRemovedMinusOne = wantFindIndex.filter(
    (index) => index !== -1,
  );

  return wantFindIndexRemovedMinusOne;
};

const getWantFindIndex = (
  gassmaControllerUtil: GassmaControllerUtil,
  wantData: FindData | DeleteData | UpdateData,
) => {
  const titles = getTitle(gassmaControllerUtil);

  return getWantFindIndexFromTitles(titles, wantData.where);
};

export { getWantFindIndex, getWantFindIndexFromTitles };
