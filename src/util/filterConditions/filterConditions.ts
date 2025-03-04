import { FilterConditions, GassmaAny } from "../../types/coreTypes";

const isFilterConditionsMatch = (
  cellData: GassmaAny,
  filterOptions: FilterConditions
): boolean => {
  const result = Object.keys(filterOptions).every((optionName) => {
    switch (optionName) {
      case "equals":
        const filterEquals = filterOptions.equals ?? "";
        return filterEquals === cellData;
      case "not":
        const filterNot = filterOptions.equals ?? "";
        return filterNot !== cellData;
      case "in":
        if (cellData === "") return false;
        return filterOptions.in.includes(cellData);
      case "notIn":
        if (cellData === "") return false;
        return !filterOptions.in.includes(cellData);
      case "lt":
        if (cellData === "") return false;
        return cellData < filterOptions.lt;
      case "lte":
        if (cellData === "") return false;
        return cellData <= filterOptions.lte;
      case "gt":
        if (cellData === "") return false;
        return cellData > filterOptions.gt;
      case "gte":
        if (cellData === "") return false;
        return cellData >= filterOptions.gte;
      case "contains":
        if (cellData === "") return false;
        return String(cellData).match(`${filterOptions.contains}`);
      case "startsWith":
        if (cellData === "") return false;
        return String(cellData).match(`^${filterOptions.startsWith}`);
      case "endsWith":
        if (cellData === "") return false;
        return String(cellData).match(`${filterOptions.endsWith}$`);
    }
  });

  return result;
};

export { isFilterConditionsMatch };
