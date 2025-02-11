import {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { normalHaving } from "../having/normalHavingFilter";
import { isLogicMatchHaving } from "./entry";

const isOrMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  havingArray: HavingUse[],
  by: string[],
  notTrue: boolean // NOTE: {NOT: {NOT: {hoge: "hoge"}}}で反転してくるようにするため
) => {
  let resultHavingData: HitByClassificationedRowData[] =
    willHavingData.concat();

  havingArray.forEach((having, havingArrayIndex) => {
    let findedHavingData = normalHaving(willHavingData, having, by);

    if ("OR" in having || "AND" in having || "NOT" in having) {
      findedHavingData = isLogicMatchHaving(
        findedHavingData,
        having,
        by,
        notTrue
      );
    }

    if (havingArrayIndex === 0) {
      resultHavingData = findedHavingData;
      return;
    }

    const alreadyHitByClassificationRowNumbers = resultHavingData.map(
      (row) => row.rowNumber
    );

    const newInsertedArray = findedHavingData.filter(
      (row) => !alreadyHitByClassificationRowNumbers.includes(row.rowNumber)
    );

    resultHavingData = resultHavingData.concat(newInsertedArray);
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

export { isOrMatchHaving };
