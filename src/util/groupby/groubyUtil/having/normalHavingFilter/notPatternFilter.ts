import {
  HavingCore,
  HavingUse,
  HitByClassificationedRowData,
  MatchFilterConditionsKeys,
  TranspositionHavingConditionKeys,
} from "../../../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../../../filterConditions/filterConditions";

const transportationUsedHavingFilterCondition = (
  matchKeys: MatchFilterConditionsKeys
) => {
  const transported: TranspositionHavingConditionKeys = {};

  Object.keys(matchKeys).forEach((pattern) => {
    const patternContent = matchKeys[pattern];
    Object.keys(patternContent).forEach((item) => {
      const itemContent = patternContent[item];
      transported[item] = { [pattern]: itemContent };
    });
  });

  return transported;
};

const notPatternFilter = (
  byClassificationedRow: HitByClassificationedRowData[],
  havingData: HavingUse,
  isNotProcess: boolean
) => {
  const matchKeys: MatchFilterConditionsKeys = {
    equals: {},
    not: {},
    in: {},
    notIn: {},
    lt: {},
    lte: {},
    gt: {},
    gte: {},
    contains: {},
    startsWith: {},
    endsWith: {},
  };

  Object.keys(havingData).forEach((key) => {
    if (key === "AND" || key === "OR" || key === "NOT") return;
    const filterconditionDataValues = havingData[key] as HavingCore;

    if ("equals" in filterconditionDataValues)
      matchKeys.equals[key] = filterconditionDataValues.equals;
    if ("not" in filterconditionDataValues)
      matchKeys.not[key] = filterconditionDataValues.not;
    if ("in" in filterconditionDataValues)
      matchKeys.in[key] = filterconditionDataValues.in;
    if ("notIn" in filterconditionDataValues)
      matchKeys.notIn[key] = filterconditionDataValues.notIn;
    if ("lt" in filterconditionDataValues)
      matchKeys.lt[key] = filterconditionDataValues.lt;
    if ("lte" in filterconditionDataValues)
      matchKeys.lte[key] = filterconditionDataValues.lte;
    if ("gt" in filterconditionDataValues)
      matchKeys.gt[key] = filterconditionDataValues.gt;
    if ("gte" in filterconditionDataValues)
      matchKeys.gte[key] = filterconditionDataValues.gte;
    if ("contains" in filterconditionDataValues)
      matchKeys.contains[key] = filterconditionDataValues.contains;
    if ("startsWith" in filterconditionDataValues)
      matchKeys.startsWith[key] = filterconditionDataValues.startsWith;
    if ("endsWith" in filterconditionDataValues)
      matchKeys.endsWith[key] = filterconditionDataValues.endsWith;
  });

  const transportedMatchKeys =
    transportationUsedHavingFilterCondition(matchKeys);

  const usedHavingFiltercondition = byClassificationedRow.filter(
    (byClassificationedOneRow) => {
      const rowData = byClassificationedOneRow.row;

      return Object.keys(transportedMatchKeys).every((oneItem) => {
        const itemContent = transportedMatchKeys[oneItem];

        const isFilterConditionsMatchResult = isFilterConditionsMatch(
          rowData[0][oneItem],
          itemContent
        );

        return isNotProcess
          ? !isFilterConditionsMatchResult
          : isFilterConditionsMatchResult;
      });
    }
  );

  return usedHavingFiltercondition;
};

export { notPatternFilter };
