import type {
  HavingUse,
  TranspositionHavingAggregate,
} from "../../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../../filterConditions/filterConditions";

const normalHaving = (
  usedHavingAggregateTransported: TranspositionHavingAggregate[],
  havingData: HavingUse
) => {
  return usedHavingAggregateTransported.filter((one) =>
    Object.keys(one).every((item) => {
      const itemContent = one[item];

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
