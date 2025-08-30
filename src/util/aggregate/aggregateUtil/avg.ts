import {
  GassmaAggregateAvgError,
  GassmaAggregateAvgTypeError,
} from "../../../errors/aggregate/aggregateError";
import type { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getNumberSum } from "./sum/numberSum";

const getAvg = (rows: {}[], avgData: Select) => {
  const avgKeys = Object.keys(avgData);

  const avgResult = {};

  avgKeys.forEach((key) => {
    const hitsDataIncludeNull = rows.map((row) => {
      if (row[key] === null || row[key] === undefined) return null;

      return row[key];
    });

    const hitsData = hitsDataIncludeNull.filter((row) => row !== null);

    if (hitsData.length === 0) {
      avgResult[key] = null;
      return;
    }

    switch (getHitsDataType(hitsData)) {
      case "number":
        avgResult[key] = getNumberSum(hitsData) / hitsData.length;
        break;
      case false:
        throw new GassmaAggregateAvgError();
      default:
        throw new GassmaAggregateAvgTypeError();
    }
  });

  return avgResult;
};

export { getAvg };
