import {
  GassmaAggregateMaxError,
  GassmaAggregateTypeError,
} from "../../../errors/aggregate/aggregateError";
import { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getBooleanMax } from "./max/booleanMax";
import { getDateMax } from "./max/dateMax";
import { getStringMax } from "./max/stringMax";

const getMax = (rows: {}[], avgData: Select) => {
  const maxKeys = Object.keys(avgData);

  const maxResult = {};

  maxKeys.forEach((key) => {
    const hitsDataIncludeNull = rows.map((row) => {
      if (row[key] === "" || row[key] === undefined) return null;

      return row[key];
    });

    const hitsData = hitsDataIncludeNull.filter((row) => row !== null);

    if (hitsData.length === 0) {
      maxResult[key] = null;
      return;
    }

    switch (getHitsDataType(hitsData)) {
      case "string":
        maxResult[key] = getStringMax(hitsData);
      case "Date":
        maxResult[key] = getDateMax(hitsData);
      case "boolean":
        maxResult[key] = getBooleanMax(hitsData);
      case "number":
        maxResult[key] = Math.max(...hitsData);
      case false:
        throw new GassmaAggregateMaxError();
      default:
        throw new GassmaAggregateTypeError();
    }
  });

  return maxResult;
};

export { getMax };
