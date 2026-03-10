import type { Select } from "../../types/coreTypes";

const stripIgnoreFromSelect = (
  select: Select,
  ignoredFields: string[],
): Select => {
  const result: Select = {};
  Object.keys(select).forEach((key) => {
    if (ignoredFields.indexOf(key) === -1) {
      result[key] = select[key];
    }
  });
  return result;
};

export { stripIgnoreFromSelect };
