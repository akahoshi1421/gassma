import {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { isAndMatchHaving } from "./and";
import { isNotMatchHaving } from "./not";
import { isOrMatchHaving } from "./or";

const isLogicMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  having: HavingUse,
  by: string[],
  notTrue: boolean // NOTE: {NOT: {NOT: {hoge: "hoge"}}}で反転してくるようにするため
) => {
  const and = having.AND || null;
  const or = having.OR || null;
  const not = having.NOT || null;

  let result: HitByClassificationedRowData[] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatchHaving(willHavingData, andArray, by, notTrue);
  }

  if (or) {
    const orResult = isOrMatchHaving(willHavingData, or, by, notTrue);

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
    const notResult = isNotMatchHaving(willHavingData, notArray, by, !notTrue);

    if (result.length === 0) result = notResult;
    else {
      const alreadyHitRowNumbers = result.map((row) => row.rowNumber);

      result = notResult.filter((row) =>
        alreadyHitRowNumbers.includes(row.rowNumber)
      );
    }
  }

  return result;
};

export { isLogicMatchHaving };
