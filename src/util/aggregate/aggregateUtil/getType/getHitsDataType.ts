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

const getHitsDataType = (hitsData: any[]): HitDateType | false => {
  let hitDataType: HitDateType = typeof hitsData[0];
  if (hitsData[0] instanceof Date) hitDataType = "Date";

  const isAllDataTypeSame = hitsData.every(
    (data) => typeof data === hitDataType
  );

  return isAllDataTypeSame ? hitDataType : false;
};

export { getHitsDataType };