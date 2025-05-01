import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findManyFunc } from "./findMany";

const findFirstFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  findData: FindData
) => {
  const findedRows = findManyFunc(gassmaControllerUtil, findData);
  if (findedRows.length === 0) return null;

  return findedRows[0];
};

export { findFirstFunc };
