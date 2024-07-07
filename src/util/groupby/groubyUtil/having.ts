import {
  AnyUse,
  GassmaAny,
  HavingAggregate,
  HavingUse,
  MatchKeys,
} from "../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../filterConditions/filterConditions";
import { getAggregate } from "./getAggregate";

type TranspositionHavingAggregate = {
  [key: string]: {
    _avg?: GassmaAny;
    _count?: GassmaAny;
    _max?: GassmaAny;
    _min?: GassmaAny;
    _sum?: GassmaAny;
  };
};

const transportationUsedHavingData = (
  useHavingData: HavingAggregate[]
): TranspositionHavingAggregate[] => {
  return useHavingData.map((one) => {
    const oneResult: TranspositionHavingAggregate = {};

    Object.keys(one).forEach((pattern) => {
      const content = one[pattern];

      Object.keys(content).forEach((item) => {
        if (!(item in oneResult)) oneResult[item] = {};

        oneResult[item][pattern] = content[item];
      });
    });

    return oneResult;
  });
};

const havingFilter = (
  byClassificationedRow: AnyUse[][],
  havingData: HavingUse
) => {
  const matchKeys: MatchKeys = {
    _avg: {},
    _count: {},
    _max: {},
    _min: {},
    _sum: {},
  };

  Object.keys(havingData).forEach((key) => {
    if (key === "AND" || key === "OR" || key === "NOT") return;
    const aggregateDataValues = havingData[key];

    if ("_avg" in aggregateDataValues) matchKeys._avg[key] = true;
    if ("_count" in aggregateDataValues) matchKeys._count[key] = true;
    if ("_max" in aggregateDataValues) matchKeys._max[key] = true;
    if ("_min" in aggregateDataValues) matchKeys._min[key] = true;
    if ("_sum" in aggregateDataValues) matchKeys._sum[key] = true;
  });

  const usedHavingAggregate = byClassificationedRow.map(
    (byClassificationedOneRow) =>
      getAggregate(byClassificationedOneRow, matchKeys)
  );

  const usedHavingAggregateTransported =
    transportationUsedHavingData(usedHavingAggregate);

  const resultIgnoreLogic = usedHavingAggregateTransported.filter((one) =>
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

export { havingFilter };
