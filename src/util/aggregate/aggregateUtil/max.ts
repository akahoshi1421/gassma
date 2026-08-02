import { isMissingAggregateValue } from "./isMissingAggregateValue";
import {
  GassmaAggregateMaxError,
  GassmaAggregateTypeError,
} from "../../../errors/aggregate/aggregateError";
import type { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getBooleanMax } from "./max/booleanMax";
import { getDateMax } from "./max/dateMax";
import { getStringMax } from "./max/stringMax";

const getMax = (rows: Record<string, any>[], avgData: Select) => {
  const maxKeys = Object.keys(avgData);

  const maxResult = {};

  maxKeys.forEach((key) => {
    const hitsData = rows
      .map((row) => row[key])
      .filter((value) => !isMissingAggregateValue(value));

    if (hitsData.length === 0) {
      maxResult[key] = null;
      return;
    }

    switch (getHitsDataType(hitsData)) {
      case "string":
        maxResult[key] = getStringMax(hitsData);
        break;
      case "Date":
        maxResult[key] = getDateMax(hitsData);
        break;
      case "boolean":
        maxResult[key] = getBooleanMax(hitsData);
        break;
      case "number":
        maxResult[key] = hitsData.reduce(
          (a, b) => Math.max(a, b),
          Number.NEGATIVE_INFINITY,
        );
        break;
      case false:
        throw new GassmaAggregateMaxError();
      default:
        throw new GassmaAggregateTypeError();
    }
  });

  return maxResult;
};

export { getMax };
