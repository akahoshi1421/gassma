import {
  AnyUse,
  HavingAggregate,
  HavingUse,
  MatchKeys,
  TranspositionHavingAggregate,
} from "../../../types/coreTypes";
import { getAggregate } from "./getAggregate";
import { normalHaving } from "./having/normalHavingFilter";

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

  const resultIgnoreLogic = normalHaving(
    usedHavingAggregateTransported,
    havingData
  );

  console.log(resultIgnoreLogic);
};

export { havingFilter };
