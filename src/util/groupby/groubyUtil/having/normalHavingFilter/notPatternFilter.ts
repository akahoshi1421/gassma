import {
  GassmaAny,
  HavingCore,
  HavingUse,
  HitByClassificationedRowData,
  MatchFilterConditionsKeys,
  TranspositionHavingConditionKeys,
} from "../../../../../types/coreTypes";
import { isFilterConditionsMatch } from "../../../../filterConditions/filterConditions";
import { isDict } from "../../../../other/isDict";

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
    const filterconditionDataValues = havingData[key] as HavingCore | GassmaAny;
    if (!isDict(filterconditionDataValues)) {
      matchKeys.equals[key] = filterconditionDataValues as GassmaAny;
      return;
    }

    const filterconditionDataValuesRemovedGassmaAny =
      filterconditionDataValues as HavingCore;

    if ("equals" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.equals[key] = filterconditionDataValuesRemovedGassmaAny.equals;
    if ("not" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.not[key] = filterconditionDataValuesRemovedGassmaAny.not;
    if ("in" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.in[key] = filterconditionDataValuesRemovedGassmaAny.in;
    if ("notIn" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.notIn[key] = filterconditionDataValuesRemovedGassmaAny.notIn;
    if ("lt" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.lt[key] = filterconditionDataValuesRemovedGassmaAny.lt;
    if ("lte" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.lte[key] = filterconditionDataValuesRemovedGassmaAny.lte;
    if ("gt" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.gt[key] = filterconditionDataValuesRemovedGassmaAny.gt;
    if ("gte" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.gte[key] = filterconditionDataValuesRemovedGassmaAny.gte;
    if ("contains" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.contains[key] =
        filterconditionDataValuesRemovedGassmaAny.contains;
    if ("startsWith" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.startsWith[key] =
        filterconditionDataValuesRemovedGassmaAny.startsWith;
    if ("endsWith" in filterconditionDataValuesRemovedGassmaAny)
      matchKeys.endsWith[key] =
        filterconditionDataValuesRemovedGassmaAny.endsWith;
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
