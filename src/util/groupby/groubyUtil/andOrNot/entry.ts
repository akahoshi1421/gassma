import { AnyUse, HavingUse } from "../../../../types/coreTypes";
import { isAndMatchHaving } from "./and";

const isLogicMatchHaving = (willHavingData: AnyUse[][], having: HavingUse) => {
  const and = having.AND || null;
  const or = having.OR || null;
  const not = having.NOT || null;

  let result: AnyUse[][] = [];

  if (and) {
    const andArray = Array.isArray(and) ? and : [and];
    result = isAndMatchHaving(willHavingData, andArray);
  }

  if (or) {
  }

  if (not) {
    const notArray = Array.isArray(not) ? not : [not];
  }

  return result;
};

export { isLogicMatchHaving };
