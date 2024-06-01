import {
  GassmaAggregateMinError,
  GassmaAggregateTypeError,
} from "../../../errors/aggregate/aggregateError";
import { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getBooleanMin } from "./min/booleanMin";
import { getDateMin } from "./min/dateMin";
import { getStringMin } from "./min/stringMin";

const getMin = (rows: {}[], avgData: Select) => {
  const minKeys = Object.keys(avgData);

  const minResult = {};

  minKeys.forEach((key) => {
    const hitsDataIncludeNull = rows.map((row) => {
      if (row[key] === "" || row[key] === undefined) return null;

      return row[key];
    });

    const hitsData = hitsDataIncludeNull.filter((row) => row !== null);

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
        minResult[key] = Math.min(...hitsData);
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
