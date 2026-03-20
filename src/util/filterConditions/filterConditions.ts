import type { FilterConditions, GassmaAny } from "../../types/coreTypes";

const isFilterConditionsMatch = (
  cellData: GassmaAny,
  filterOptions: FilterConditions,
): boolean => {
  const result = Object.keys(filterOptions).every((optionName) => {
    switch (optionName) {
      case "equals": {
        const filterEquals =
          filterOptions.equals === "" ? null : filterOptions.equals;
        if (
          filterOptions.mode === "insensitive" &&
          typeof filterEquals === "string" &&
          typeof cellData === "string"
        ) {
          return filterEquals.toLowerCase() === cellData.toLowerCase();
        }
        return filterEquals === cellData;
      }
      case "not": {
        const filterNot = filterOptions.not === "" ? null : filterOptions.not;
        if (
          filterOptions.mode === "insensitive" &&
          typeof filterNot === "string" &&
          typeof cellData === "string"
        ) {
          return filterNot.toLowerCase() !== cellData.toLowerCase();
        }
        return filterNot !== cellData;
      }
      case "in":
        if (cellData === null) return false;
        return filterOptions.in.includes(cellData);
      case "notIn":
        if (cellData === null) return false;
        return !filterOptions.notIn.includes(cellData);
      case "lt":
        if (cellData === null) return false;
        return cellData < filterOptions.lt;
      case "lte":
        if (cellData === null) return false;
        return cellData <= filterOptions.lte;
      case "gt":
        if (cellData === null) return false;
        return cellData > filterOptions.gt;
      case "gte":
        if (cellData === null) return false;
        return cellData >= filterOptions.gte;
      case "contains": {
        if (cellData === null) return false;
        const cellStr = String(cellData);
        const containsPattern = filterOptions.contains;
        if (filterOptions.mode === "insensitive") {
          return cellStr.toLowerCase().includes(containsPattern.toLowerCase());
        }
        return cellStr.includes(containsPattern);
      }
      case "startsWith": {
        if (cellData === null) return false;
        const cellStrSw = String(cellData);
        const swPattern = filterOptions.startsWith;
        if (filterOptions.mode === "insensitive") {
          return cellStrSw.toLowerCase().startsWith(swPattern.toLowerCase());
        }
        return cellStrSw.startsWith(swPattern);
      }
      case "endsWith": {
        if (cellData === null) return false;
        const cellStrEw = String(cellData);
        const ewPattern = filterOptions.endsWith;
        if (filterOptions.mode === "insensitive") {
          return cellStrEw.toLowerCase().endsWith(ewPattern.toLowerCase());
        }
        return cellStrEw.endsWith(ewPattern);
      }
      case "mode":
        return true;
      default:
        return true;
    }
  });

  return result;
};

export { isFilterConditionsMatch };
