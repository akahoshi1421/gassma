import type { Omit, Select } from "../../types/coreTypes";

const resolveGlobalOmit = (
  globalOmit: Omit | null,
  select: Select | null | undefined,
  queryOmit: Record<string, boolean> | null | undefined,
): Omit | null => {
  if (select) return null;

  if (!globalOmit) {
    if (!queryOmit) return null;
    const result: Omit = {};
    Object.keys(queryOmit).forEach((key) => {
      if (queryOmit[key]) result[key] = true;
    });
    return Object.keys(result).length > 0 ? result : null;
  }

  if (!queryOmit) return globalOmit;

  const merged: Omit = { ...globalOmit };
  Object.keys(queryOmit).forEach((key) => {
    if (queryOmit[key] === false) {
      delete merged[key];
    } else {
      merged[key] = true;
    }
  });

  return Object.keys(merged).length > 0 ? merged : null;
};

export { resolveGlobalOmit };
