import type { AnyUse, Omit } from "../../../types/coreTypes";

const omitFunc = (omit: Omit, row: AnyUse) => {
  const result = { ...row };
  const omitKeys = Object.keys(omit);

  omitKeys.forEach((key) => delete result[key]);

  return result;
};

export { omitFunc };
