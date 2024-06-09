import { GassmaAny } from "../../../../types/coreTypes";

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
  if (hitsData[0] instanceof Date) hitDataType = "Date";

  const isAllDataTypeSame = hitsData.every((data) => {
    return typeof data === hitDataType;
  });

  return isAllDataTypeSame ? hitDataType : false;
};

export { getHitsDataType };
