import { isMissingAggregateValue } from "./isMissingAggregateValue";
import {
  GassmaAggregateAvgError,
  GassmaAggregateAvgTypeError,
} from "../../../errors/aggregate/aggregateError";
import type { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getNumberSum } from "./sum/numberSum";

const getAvg = (rows: Record<string, any>[], avgData: Select) => {
  const avgKeys = Object.keys(avgData);

  const avgResult = {};

  avgKeys.forEach((key) => {
    const hitsData = rows
      .map((row) => row[key])
      .filter((value) => !isMissingAggregateValue(value));

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
