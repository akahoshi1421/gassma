import type {
  HavingAggregateWithIndex,
  HavingUse,
  HitByClassificationedRowData,
  MatchKeys,
  TranspositionHavingAggregate,
  TranspositionHavingAggregateWithIndex,
} from "../../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../../filterConditions/filterConditions";
import { isDict } from "../../../other/isDict";
import { getAggregate } from "../getAggregate";

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

const normalHaving = (
  byClassificationedRow: HitByClassificationedRowData[],
  havingData: HavingUse,
  isNotProcess: boolean = false
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

  const usedHavingAggregate: HavingAggregateWithIndex[] =
    byClassificationedRow.map((byClassificationedOneRow) => {
      return {
        havingAggregateData: getAggregate(
          byClassificationedOneRow.row,
          matchKeys
        ),
        index: byClassificationedOneRow.rowNumber,
      };
    });

  const usedHavingAggregateTransported =
    transportationUsedHavingData(usedHavingAggregate);

  const normalHavingResult = usedHavingAggregateTransported.filter((one) =>
    Object.keys(one.havingAggregateData).every((item) => {
      const itemContent = one.havingAggregateData[item];

      return Object.keys(itemContent).every((pattern) => {
        const patternContent = itemContent[pattern];
        const patternData = havingData[item][pattern];

        const isFilterConditionsMatchResult = isFilterConditionsMatch(
          patternContent,
          isDict(patternData) ? patternData : { equals: patternData }
        );

        return isNotProcess
          ? !isFilterConditionsMatchResult
          : isFilterConditionsMatchResult;
      });
    })
  );

  const normalHavingFiltered = normalHavingResult.map(
    (oneHavingAggregateData) =>
      byClassificationedRow.find(
        (oneByClassificationedRow) =>
          oneByClassificationedRow.rowNumber === oneHavingAggregateData.index
      )
  );

  return normalHavingFiltered;
};

export { normalHaving };
