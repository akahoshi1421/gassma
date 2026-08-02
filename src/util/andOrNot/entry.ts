import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import type { GassmaAny, WhereUse } from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { isAndMatch } from "./and";
import { isNotMatch } from "./not";
import { isOrMatch } from "./or";

const isLogicMatch = (
  rowData: HitRowData[],
  where: WhereUse,
  titles: GassmaAny[],
) => {
  const and = "AND" in where ? where.AND : null;
  const or = "OR" in where ? where.OR : null;
  const not = "NOT" in where ? where.NOT : null;

  let result = rowData;

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatch(result, andArray, titles);
  }

  if (or) {
    if (!Array.isArray(or)) {
      throw new GassmaInvalidValueError("OR", "an array of where conditions");
    }
    result = isOrMatch(result, or, titles);
  }

  if (not) {
    const notArray = Array.isArray(not) ? not : [not];
    result = isNotMatch(result, notArray, titles);
  }

  return result;
};

export { isLogicMatch };
