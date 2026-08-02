import type { Select } from "../../../types/coreTypes";

const getCount = (rows: Record<string, any>[], countData: Select | true) => {
  if (countData === true) return rows.length;

  const countKeys = Object.keys(countData);

  const countResult = {};

  countKeys.forEach((key) => {
    if (key === "_all") {
      countResult[key] = rows.length;
      return;
    }

    const hitCount = rows.filter((row) => {
      return row[key] !== null && row[key] !== undefined;
    }).length;

    countResult[key] = hitCount;
  });

  return countResult;
};

export { getCount };
