import { CountData } from "../../types/countType";
import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findManyFunc } from "../find/findMany";

const countFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  countData: CountData
) => {
  const findData = {
    ...countData,
  } as FindData;

  return findManyFunc(gassmaControllerUtil, findData).length;
};

export { countFunc };
