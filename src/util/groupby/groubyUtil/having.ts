import {
  AnyUse,
  HavingUse,
  HitByClassificationedRowData,
} from "../../../types/coreTypes";
import { isLogicMatchHaving } from "./andOrNot/entry";
import { normalHaving } from "./having/normalHavingFilter";

const removeIndex = (
  havingMatchingIncludeIndex: HitByClassificationedRowData[]
) => {
  return havingMatchingIncludeIndex.map(
    (oneHavingMatchingIncludeIndex) => oneHavingMatchingIncludeIndex.row
  );
};

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

  if (!("OR" in havingData || "AND" in havingData || "NOT" in havingData)) {
    const removeedNormalHavingFiltered = removeIndex(normalHavingFiltered);

    return removeedNormalHavingFiltered;
  }

  const logicMatchHavingResult = isLogicMatchHaving(
    normalHavingFiltered,
    havingData
  );
  const removedLogicMatchHavingResult = removeIndex(logicMatchHavingResult);

  return removedLogicMatchHavingResult;
};

export { havingFilter };
