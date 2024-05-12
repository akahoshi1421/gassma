import { WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getWantFindIndex } from "../core/getWantFindIndex";

const isOrMatch = (
  rows: any[][],
  whereArray: WhereUse[],
  titles: any[],
  gassmaControllerUtil: GassmaControllerUtil
) => {
  let resultRows: any[][] = rows.concat();

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndex(gassmaControllerUtil, {
      where: where,
    });
  });

  return [[]];
};

export { isOrMatch };
