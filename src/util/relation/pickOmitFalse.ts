import type { QueryOmit } from "../../types/coreTypes";

const pickOmitFalse = (omit?: QueryOmit): QueryOmit | undefined => {
  if (!omit) return undefined;
  const falseKeys = Object.keys(omit).filter((key) => omit[key] === false);
  if (falseKeys.length === 0) return undefined;

  const result: QueryOmit = {};
  falseKeys.forEach((key) => {
    result[key] = false;
  });
  return result;
};

export { pickOmitFalse };
