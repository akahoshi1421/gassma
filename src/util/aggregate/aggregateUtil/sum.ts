import {
  GassmaAggregateSumError,
  GassmaAggregateSumTypeError,
} from "../../../errors/aggregate/aggregateError";
import { Select } from "../../../types/coreTypes";
import { getHitsDataType } from "./getType/getHitsDataType";
import { getNumberSum } from "./sum/numberSum";

const getSum = (rows: {}[], avgData: Select) => {
  const sumKeys = Object.keys(avgData);

  const sumResult = {};

  sumKeys.forEach((key) => {
    const hitsDataIncludeNull = rows.map((row) => {
      if (row[key] === "" || row[key] === undefined) return null;

      return row[key];
    });

    const hitsData = hitsDataIncludeNull.filter((row) => row !== null);

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
