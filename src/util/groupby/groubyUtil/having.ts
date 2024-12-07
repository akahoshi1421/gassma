import {
  AnyUse,
  HavingAggregate,
  HavingAggregateWithIndex,
  HavingUse,
  MatchKeys,
  TranspositionHavingAggregate,
  TranspositionHavingAggregateWithIndex,
} from "../../../types/coreTypes";
import { getAggregate } from "./getAggregate";
import { normalHaving } from "./having/normalHavingFilter";

const transportationUsedHavingData = (
  useHavingData: HavingAggregateWithIndex[]
): TranspositionHavingAggregateWithIndex[] => {
  return useHavingData.map((one) => {
    const oneResult: TranspositionHavingAggregate = {};

    Object.keys(one.havingAggregateData).forEach((pattern) => {
      const content = one.havingAggregateData[pattern];

      Object.keys(content).forEach((item) => {
        if (!(item in oneResult)) oneResult[item] = {};

        oneResult[item][pattern] = content[item];
      });
    });

    return { havingAggregateData: oneResult, index: one.index };
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

  console.log(byClassificationedRow);
  const usedHavingAggregate: HavingAggregateWithIndex[] =
    byClassificationedRow.map((byClassificationedOneRow, index) => {
      return {
        havingAggregateData: getAggregate(byClassificationedOneRow, matchKeys),
        index,
      };
    });

  const usedHavingAggregateTransported =
    transportationUsedHavingData(usedHavingAggregate);

  const normalHavingResult = normalHaving(
    usedHavingAggregateTransported,
    havingData
  );

  console.dir(normalHavingResult, { depth: null });
};

export { havingFilter };
