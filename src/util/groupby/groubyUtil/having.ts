import { AnyUse, HavingUse } from "../../../types/coreTypes";
import { normalHaving } from "./having/normalHavingFilter";

const havingFilter = (
  byClassificationedRow: AnyUse[][],
  havingData: HavingUse
) => {
  const normalHavingFiltered = normalHaving(byClassificationedRow, havingData);
};

export { havingFilter };
