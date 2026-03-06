import type { FilterConditions, GassmaAny } from "../../types/coreTypes";
import { isFilterConditionsMatch } from "./filterConditions";
import { resolveFieldRefs } from "./resolveFieldRefs";

const matchFilterCondition = (
  cellData: GassmaAny,
  filterOptions: FilterConditions,
  row: GassmaAny[],
  titles: GassmaAny[],
): boolean => {
  const resolved = resolveFieldRefs(filterOptions, row, titles);
  return isFilterConditionsMatch(cellData, resolved);
};

export { matchFilterCondition };
