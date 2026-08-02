import { isMissingAggregateValue } from "./isMissingAggregateValue";
import {
  GassmaAggregateSumError,
  GassmaAggregateSumTypeError,
} from "../../../errors/aggregate/aggregateError";
import type { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getNumberSum } from "./sum/numberSum";

const getSum = (rows: Record<string, any>[], avgData: Select) => {
  const sumKeys = Object.keys(avgData);

  const sumResult = {};

  sumKeys.forEach((key) => {
    const hitsData = rows
      .map((row) => row[key])
      .filter((value) => !isMissingAggregateValue(value));

    if (hitsData.length === 0) {
      sumResult[key] = null;
      return;
    }

    switch (getHitsDataType(hitsData)) {
      case "number":
        sumResult[key] = getNumberSum(hitsData);
        break;
      case false:
        throw new GassmaAggregateSumError();
      default:
        throw new GassmaAggregateSumTypeError();
    }
  });

  return sumResult;
};

export { getSum };
