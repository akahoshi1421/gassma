import { GassmaGroupByHavingDontWriteByError } from "../../../../../errors/groupBy/groupByError";
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

const dontWriteByErrorCheck = (key: string, by: string[]) => {
  if (!by.includes(key)) throw new GassmaGroupByHavingDontWriteByError();
};

const transportationUsedHavingFilterCondition = (
  matchKeys: MatchFilterConditionsKeys
) => {
  const transported: TranspositionHavingConditionKeys = {};

  Object.keys(matchKeys).forEach((pattern) => {
    const patternContent = matchKeys[pattern];
    Object.keys(patternContent).forEach((item) => {
      const itemContent = patternContent[item];
      if (transported[item]) transported[item][pattern] = itemContent;
      else transported[item] = { [pattern]: itemContent };
    });
  });

  return transported;
};

const notPatternFilter = (
  byClassificationedRow: HitByClassificationedRowData[],
  havingData: HavingUse,
  isNotProcess: boolean,
  by: string[]
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
      dontWriteByErrorCheck(key, by);
      return;
    }

    const filterconditionDataValuesRemovedGassmaAny =
      filterconditionDataValues as HavingCore;

    if ("equals" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.equals[key] = filterconditionDataValuesRemovedGassmaAny.equals;
      dontWriteByErrorCheck(key, by);
    }
    if ("not" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.not[key] = filterconditionDataValuesRemovedGassmaAny.not;
      dontWriteByErrorCheck(key, by);
    }
    if ("in" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.in[key] = filterconditionDataValuesRemovedGassmaAny.in;
      dontWriteByErrorCheck(key, by);
    }
    if ("notIn" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.notIn[key] = filterconditionDataValuesRemovedGassmaAny.notIn;
      dontWriteByErrorCheck(key, by);
    }
    if ("lt" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.lt[key] = filterconditionDataValuesRemovedGassmaAny.lt;
      dontWriteByErrorCheck(key, by);
    }
    if ("lte" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.lte[key] = filterconditionDataValuesRemovedGassmaAny.lte;
      dontWriteByErrorCheck(key, by);
    }
    if ("gt" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.gt[key] = filterconditionDataValuesRemovedGassmaAny.gt;
      dontWriteByErrorCheck(key, by);
    }
    if ("gte" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.gte[key] = filterconditionDataValuesRemovedGassmaAny.gte;
      dontWriteByErrorCheck(key, by);
    }
    if ("contains" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.contains[key] =
        filterconditionDataValuesRemovedGassmaAny.contains;
      dontWriteByErrorCheck(key, by);
    }
    if ("startsWith" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.startsWith[key] =
        filterconditionDataValuesRemovedGassmaAny.startsWith;
      dontWriteByErrorCheck(key, by);
    }
    if ("endsWith" in filterconditionDataValuesRemovedGassmaAny) {
      matchKeys.endsWith[key] =
        filterconditionDataValuesRemovedGassmaAny.endsWith;
      dontWriteByErrorCheck(key, by);
    }
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
