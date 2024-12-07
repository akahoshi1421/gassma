import {
  HavingUse,
  HitByClassificationedRowData,
} from "../../../../types/coreTypes";
import { normalHaving } from "../having/normalHavingFilter";
import { isLogicMatchHaving } from "./entry";

const isAndMatchHaving = (
  willHavingData: HitByClassificationedRowData[],
  havingArray: HavingUse[]
) => {
  let resultHavingData: HitByClassificationedRowData[] =
    willHavingData.concat();

  havingArray.forEach((having) => {
    resultHavingData = normalHaving(resultHavingData, having);

    if ("OR" in having || "AND" in having || "NOT" in having) {
      resultHavingData = isLogicMatchHaving(resultHavingData, having);
    }
  });

  return resultHavingData;
};

export { isAndMatchHaving };
