import {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { isAndMatchHaving } from "./and";
import { isOrMatchHaving } from "./or";

const isLogicMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  having: HavingUse
) => {
  const and = having.AND || null;
  const or = having.OR || null;
  const not = having.NOT || null;

  let result: HitByClassificationedRowData[] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatchHaving(willHavingData, andArray);
  }

  if (or) {
    const orResult = isOrMatchHaving(willHavingData, or);

    if (result.length === 0) result = orResult;
    else {
      const alreadyHitRowNumbers = result.map((row) => row.rowNumber);

      result = orResult.filter((row) =>
        alreadyHitRowNumbers.includes(row.rowNumber)
      );
    }
  }

  if (not) {
    const notArray = Array.isArray(not) ? not : [not];
  }

  return result;
};

export { isLogicMatchHaving };
