import { WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { isAndMatch } from "./and";
import { isNotMatch } from "./not";
import { isOrMatch } from "./or";

const isLogicMatch = (
  row: any[][],
  where: WhereUse,
  titles: any[],
  gassmaControllerUtil: GassmaControllerUtil
) => {
  const and = "AND" in where ? where.AND : null;
  const or = "OR" in where ? where.OR : null;
  const not = "NOT" in where ? where.NOT : null;

  let result: any[][] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatch(row, andArray, titles, gassmaControllerUtil);
  }

  if (or) {
    const orArray = Array.isArray(or) ? or : [or];
    result = isOrMatch(result, orArray, titles, gassmaControllerUtil);
  }

  if (not) {
    const notArray = Array.isArray(not) ? not : [not];
    result = isNotMatch(result, notArray, titles, gassmaControllerUtil);
  }

  return result;
};

export { isLogicMatch };
