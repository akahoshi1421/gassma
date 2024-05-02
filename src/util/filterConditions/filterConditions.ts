import { FilterConditions } from "../../types/coreTypes";

const isFilterConditionsMatch = (
  cellData: any,
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
        return filterOptions.contains.indexOf(cellData) !== -1;
      case "startsWith":
        return filterOptions.startsWith.match(`^${cellData}`);
      case "endsWith":
        return filterOptions.endsWith.match(`${cellData}$`);
    }
  });

  return result;
};

export { isFilterConditionsMatch };
