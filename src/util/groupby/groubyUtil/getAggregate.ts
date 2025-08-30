import type { AnyUse, HavingAggregate, MatchKeys } from "../../../types/coreTypes";
import { getAvg } from "../../aggregate/aggregateUtil/avg";
import { getCount } from "../../aggregate/aggregateUtil/count";
import { getMax } from "../../aggregate/aggregateUtil/max";
import { getMin } from "../../aggregate/aggregateUtil/min";
import { getSum } from "../../aggregate/aggregateUtil/sum";

const getAggregate = (
  byClassificationedRow: AnyUse[],
  matchKeys: MatchKeys
): HavingAggregate => {
  const aggregateResult = {
    _avg: {},
    _count: {},
    _max: {},
    _min: {},
    _sum: {},
  };

  Object.keys(matchKeys).forEach((key) => {
    switch (key) {
      case "_avg":
        aggregateResult._avg = getAvg(byClassificationedRow, matchKeys._avg);
      case "_count":
        aggregateResult._count = getCount(
          byClassificationedRow,
          matchKeys._count
        );
      case "_max":
        aggregateResult._max = getMax(byClassificationedRow, matchKeys._max);
      case "_min":
        aggregateResult._min = getMin(byClassificationedRow, matchKeys._min);
      case "_sum":
        aggregateResult._sum = getSum(byClassificationedRow, matchKeys._sum);
    }
  });

  return aggregateResult;
};

export { getAggregate };
