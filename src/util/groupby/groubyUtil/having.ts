import {
  AnyUse,
  HavingUse,
  HitByClassificationedRowData,
} from "../../../types/coreTypes";
import { isLogicMatchHaving } from "./andOrNot/entry";
import { normalHaving } from "./having/normalHavingFilter";

const havingFilter = (
  byClassificationedRow: AnyUse[][],
  havingData: HavingUse
) => {
  const byClassificationedRowIncludeIndex: HitByClassificationedRowData[] =
    byClassificationedRow.map((byClassificationedOneRow, index) => {
      return { rowNumber: index, row: byClassificationedOneRow };
    });

  const normalHavingFiltered = normalHaving(
    byClassificationedRowIncludeIndex,
    havingData
  );

  if (!("OR" in havingData || "AND" in havingData || "NOT" in havingData))
    return normalHavingFiltered;

  return isLogicMatchHaving(normalHavingFiltered, havingData);
};

export { havingFilter };
