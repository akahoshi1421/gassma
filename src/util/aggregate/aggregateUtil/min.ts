import { isMissingAggregateValue } from "./isMissingAggregateValue";
import {
  GassmaAggregateMinError,
  GassmaAggregateTypeError,
} from "../../../errors/aggregate/aggregateError";
import type { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getBooleanMin } from "./min/booleanMin";
import { getDateMin } from "./min/dateMin";
import { getStringMin } from "./min/stringMin";

const getMin = (rows: Record<string, any>[], avgData: Select) => {
  const minKeys = Object.keys(avgData);

  const minResult = {};

  minKeys.forEach((key) => {
    const hitsData = rows
      .map((row) => row[key])
      .filter((value) => !isMissingAggregateValue(value));

    if (hitsData.length === 0) {
      minResult[key] = null;
      return;
    }

    switch (getHitsDataType(hitsData)) {
      case "string":
        minResult[key] = getStringMin(hitsData);
        break;
      case "Date":
        minResult[key] = getDateMin(hitsData);
        break;
      case "boolean":
        minResult[key] = getBooleanMin(hitsData);
        break;
      case "number":
        minResult[key] = hitsData.reduce(
          (a, b) => Math.min(a, b),
          Number.POSITIVE_INFINITY,
        );
        break;
      case false:
        throw new GassmaAggregateMinError();
      default:
        throw new GassmaAggregateTypeError();
    }
  });

  return minResult;
};

export { getMin };
