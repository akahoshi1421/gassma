import {
  GassmaFilterContainsError,
  GassmaFilterEndsWithError,
  GassmaFilterStartsWithError,
} from "../../errors/filter/filterError";
import { FilterConditions, GassmaAny } from "../../types/coreTypes";

const isFilterConditionsMatch = (
  cellData: GassmaAny,
  filterOptions: FilterConditions
): boolean => {
  const result = Object.keys(filterOptions).every((optionName) => {
    switch (optionName) {
      case "equals":
        return filterOptions.equals === cellData;
      case "not":
        return filterOptions.not !== cellData;
      case "in":
        return filterOptions.in.includes(cellData);
      case "notIn":
        return !filterOptions.notIn.includes(cellData);
      case "lt":
        return cellData < filterOptions.lt;
      case "lte":
        return cellData <= filterOptions.lte;
      case "gt":
        return cellData > filterOptions.gt;
      case "gte":
        return cellData >= filterOptions.gte;
      case "contains":
        if (typeof cellData !== "string") throw new GassmaFilterContainsError();
        return cellData.match(`${filterOptions.contains}`);
      case "startsWith":
        if (typeof cellData !== "string")
          throw new GassmaFilterStartsWithError();
        return cellData.match(`^${filterOptions.startsWith}`);
      case "endsWith":
        if (typeof cellData !== "string") throw new GassmaFilterEndsWithError();
        return cellData.match(`${filterOptions.endsWith}$`);
    }
  });

  return result;
};

export { isFilterConditionsMatch };
