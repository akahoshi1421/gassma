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

  let result: HitRowData[] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatch(rowData, andArray, titles);
  }

  if (or) {
    const orResult = isOrMatch(rowData, or, titles);

    if (result.length === 0) result = orResult;
    else {
      const alreadyHitRowNumbers = result.map((row) => row.rowNumber);

      result = orResult.filter((row) =>
        alreadyHitRowNumbers.includes(row.rowNumber),
      );
    }
  }

  if (not) {
    const notArray = Array.isArray(not) ? not : [not];
    const notResult = isNotMatch(rowData, notArray, titles);

    if (result.length === 0) result = notResult;
    else {
      const alreadyHitRowNumbers = result.map((row) => row.rowNumber);

      result = notResult.filter((row) =>
        alreadyHitRowNumbers.includes(row.rowNumber),
      );
    }
  }

  return result;
};

export { isLogicMatch };
