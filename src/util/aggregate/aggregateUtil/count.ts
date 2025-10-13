import type { Select } from "../../../types/coreTypes";

const getCount = (rows: {}[], avgData: Select) => {
  const avgKeys = Object.keys(avgData);

  const countResult = {};

  avgKeys.forEach((key) => {
    const hitCount = rows.filter((row) => {
      return row[key] !== null && row[key] !== undefined;
    }).length;

    countResult[key] = hitCount !== 0 ? hitCount : null;
  });

  return countResult;
};

export { getCount };
