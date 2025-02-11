import {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { normalHaving } from "../having/normalHavingFilter";
import { isLogicMatchHaving } from "./entry";

const isAndMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  havingArray: HavingUse[],
  by: string[],
  notTrue: boolean // NOTE: {NOT: {NOT: {hoge: "hoge"}}}で反転してくるようにするため
) => {
  let resultHavingData: HitByClassificationedRowData[] =
    willHavingData.concat();

  havingArray.forEach((having) => {
    resultHavingData = normalHaving(resultHavingData, having, by);

    if ("OR" in having || "AND" in having || "NOT" in having) {
      resultHavingData = isLogicMatchHaving(
        resultHavingData,
        having,
        by,
        notTrue
      );
    }
  });

  if (!notTrue) return resultHavingData;

  const resultHavingDataNumbers = resultHavingData.map(
    (oneHavingData) => oneHavingData.rowNumber
  );

  const notResultHavingData = willHavingData.filter(
    (oneHaving) => !resultHavingDataNumbers.includes(oneHaving.rowNumber)
  );

  return notResultHavingData;
};

export { isAndMatchHaving };
