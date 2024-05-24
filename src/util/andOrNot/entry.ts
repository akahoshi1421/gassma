import { WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { HitRowData } from "../../types/hitRowDataType";
import { isAndMatch } from "./and";
import { isNotMatch } from "./not";
import { isOrMatch } from "./or";

const isLogicMatch = (
  rowData: HitRowData[],
  where: WhereUse,
  titles: any[],
  gassmaControllerUtil: GassmaControllerUtil
) => {
  const and = "AND" in where ? where.AND : null;
  const or = "OR" in where ? where.OR : null;
  const not = "NOT" in where ? where.NOT : null;

  let result: HitRowData[] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatch(rowData, andArray, titles, gassmaControllerUtil);
  }

  return rowData;
};

export { isLogicMatch };