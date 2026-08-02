import type {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { normalHaving } from "../having/normalHavingFilter";
import { isLogicMatchHaving } from "./entry";

const isOrMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  havingArray: HavingUse[],
  by: string[],
) => {
  let resultHavingData: HitByClassificationedRowData[] =
    willHavingData.concat();

  havingArray.forEach((having, havingArrayIndex) => {
    let findedHavingData = normalHaving(willHavingData, having, by);

    if ("OR" in having || "AND" in having || "NOT" in having) {
      findedHavingData = isLogicMatchHaving(findedHavingData, having, by);
    }

    if (havingArrayIndex === 0) {
      resultHavingData = findedHavingData;
      return;
    }

    const alreadyHitByClassificationRowNumbers = new Set(
      resultHavingData.map((row) => row.rowNumber),
    );

    const newInsertedArray = findedHavingData.filter(
      (row) => !alreadyHitByClassificationRowNumbers.has(row.rowNumber),
    );

    resultHavingData = resultHavingData.concat(newInsertedArray);
  });

  return resultHavingData;
};

export { isOrMatchHaving };
