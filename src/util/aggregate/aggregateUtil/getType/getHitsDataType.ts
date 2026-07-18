import type { GassmaAny } from "../../../../types/coreTypes";
import { isDateValue } from "../../../other/isDateValue";

type HitDateType =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function"
  | "Date"
  | false;

const getHitsDataType = (hitsData: GassmaAny[]): HitDateType | false => {
  let hitDataType: HitDateType = typeof hitsData[0];
  if (isDateValue(hitsData[0])) hitDataType = "Date";

  const isAllDataTypeSame = hitsData.every((data) => {
    if (hitDataType === "Date") {
      return isDateValue(data);
    }
    return typeof data === hitDataType;
  });

  return isAllDataTypeSame ? hitDataType : false;
};

export { getHitsDataType };
