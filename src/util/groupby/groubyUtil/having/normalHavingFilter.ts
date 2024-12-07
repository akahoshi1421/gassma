import type {
  HavingUse,
  TranspositionHavingAggregateWithIndex,
} from "../../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../../filterConditions/filterConditions";

const normalHaving = (
  usedHavingAggregateTransported: TranspositionHavingAggregateWithIndex[],
  havingData: HavingUse
): TranspositionHavingAggregateWithIndex[] => {
  return usedHavingAggregateTransported.filter((one) =>
    Object.keys(one.havingAggregateData).every((item) => {
      const itemContent = one.havingAggregateData[item];

      return Object.keys(itemContent).every((pattern) => {
        const patternContent = itemContent[pattern];
        return isFilterConditionsMatch(
          patternContent,
          havingData[item][pattern]
        );
      });
    })
  );
};

export { normalHaving };
