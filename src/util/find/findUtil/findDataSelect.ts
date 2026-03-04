import type { Select } from "../../../types/coreTypes";

const findedDataSelect = (select: Select, row: Record<string, unknown>) => {
  const result = {};
  const selectKeys = Object.keys(select);

  selectKeys.forEach((key) => {
    result[key] = row[key];
  });

  return result;
};

export { findedDataSelect };
