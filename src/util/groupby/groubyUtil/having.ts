import {
  AnyUse,
  HavingUse,
  HitByClassificationedRowData,
} from "../../../types/coreTypes";
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
};

export { havingFilter };
