import type {
  HavingAggregateWithIndex,
  HavingCore,
  HavingUse,
  HitByClassificationedRowData,
  MatchKeys,
  TranspositionHavingAggregate,
  TranspositionHavingAggregateWithIndex,
} from "../../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../../filterConditions/filterConditions";
import { isDict } from "../../../other/isDict";
import { getAggregate } from "../getAggregate";
import { notPatternFilter } from "./normalHavingFilter/notPatternFilter";

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
  by: string[]
) => {
  const byClassificationedRowWithoutPattern = notPatternFilter(
    byClassificationedRow,
    havingData,
    by
  );

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
    if (!Array.isArray(aggregateDataValues) && !isDict(aggregateDataValues))
      return;

    const aggregateDataValuesRemovedGassmaAny = aggregateDataValues as
      | HavingUse
      | HavingCore
      | HavingUse[];

    if ("_avg" in aggregateDataValuesRemovedGassmaAny)
      matchKeys._avg[key] = true;
    if ("_count" in aggregateDataValuesRemovedGassmaAny)
      matchKeys._count[key] = true;
    if ("_max" in aggregateDataValuesRemovedGassmaAny)
      matchKeys._max[key] = true;
    if ("_min" in aggregateDataValuesRemovedGassmaAny)
      matchKeys._min[key] = true;
    if ("_sum" in aggregateDataValuesRemovedGassmaAny)
      matchKeys._sum[key] = true;
  });

  const usedHavingAggregate: HavingAggregateWithIndex[] =
    byClassificationedRowWithoutPattern.map((byClassificationedOneRow) => {
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

        const isFilterConditionsMatchResult = isFilterConditionsMatch(
          patternContent,
          havingData[item][pattern]
        );

        return isFilterConditionsMatchResult;
      });
    })
  );

  const normalHavingFiltered = normalHavingResult.map(
    (oneHavingAggregateData) =>
      byClassificationedRowWithoutPattern.find(
        (oneByClassificationedRow) =>
          oneByClassificationedRow.rowNumber === oneHavingAggregateData.index
      )
  );

  return normalHavingFiltered;
};

export { normalHaving };
