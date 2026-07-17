import type { QueryOmit } from "../../../types/coreTypes";

const omitFunc = (omit: QueryOmit, row: Record<string, unknown>) => {
  const result = { ...row };
  const omitKeys = Object.keys(omit).filter((key) => omit[key]);

  omitKeys.forEach((key) => {
    delete result[key];
  });

  return result;
};

export { omitFunc };
