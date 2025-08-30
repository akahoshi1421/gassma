import type { CountData } from "../../types/countType";
import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
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
