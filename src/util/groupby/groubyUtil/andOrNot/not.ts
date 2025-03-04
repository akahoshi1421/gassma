import {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { normalHaving } from "../having/normalHavingFilter";
import { isLogicMatchHaving } from "./entry";

const isNotMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  havingArray: HavingUse[],
  by: string[]
) => {
  let resultHavingData: HitByClassificationedRowData[] =
    willHavingData.concat();

  havingArray.forEach((having) => {
    resultHavingData = normalHaving(resultHavingData, having, by);

    if ("OR" in having || "AND" in having || "NOT" in having) {
      resultHavingData = isLogicMatchHaving(resultHavingData, having, by);
    }
  });

  const resultHavingDataNumbers = resultHavingData.map(
    (oneHavingData) => oneHavingData.rowNumber
  );

  const notResultHavingData = willHavingData.filter(
    (oneHaving) => !resultHavingDataNumbers.includes(oneHaving.rowNumber)
  );

  return notResultHavingData;
};

export { isNotMatchHaving };
