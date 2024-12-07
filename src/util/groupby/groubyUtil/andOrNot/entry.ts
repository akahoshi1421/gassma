import {
  HavingUse,
  TranspositionHavingAggregate,
} from "../../../../types/coreTypes";

const isLogicMatchHaving = (
  willHavingData: TranspositionHavingAggregate[],
  having: HavingUse
) => {
  const and = having.AND || null;
  const or = having.OR || null;
  const not = having.NOT || null;

  let result: TranspositionHavingAggregate[] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
  }

  if (or) {
  }

  if (not) {
    const notArray = Array.isArray(not) ? not : [not];
  }
};

export { isLogicMatchHaving };
