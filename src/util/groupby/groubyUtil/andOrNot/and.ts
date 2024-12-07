import { AnyUse, HavingUse } from "../../../../types/coreTypes";
import { normalHaving } from "../having/normalHavingFilter";
import { isLogicMatchHaving } from "./entry";

const isAndMatchHaving = (
  willHavingData: AnyUse[][],
  havingArray: HavingUse[]
) => {
  let resultHavingData: AnyUse[][] = willHavingData.concat();

  havingArray.forEach((having) => {
    resultHavingData = normalHaving(resultHavingData, having);

    if ("OR" in having || "AND" in having || "NOT" in having) {
      resultHavingData = isLogicMatchHaving(resultHavingData, having);
    }
  });

  return resultHavingData;
};

export { isAndMatchHaving };
