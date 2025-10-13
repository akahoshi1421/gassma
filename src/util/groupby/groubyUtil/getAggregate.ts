import type {
  AnyUse,
  HavingAggregate,
  MatchKeys,
} from "../../../types/coreTypes";
import { getAvg } from "../../aggregate/aggregateUtil/avg";
import { getCount } from "../../aggregate/aggregateUtil/count";
import { getMax } from "../../aggregate/aggregateUtil/max";
import { getMin } from "../../aggregate/aggregateUtil/min";
import { getSum } from "../../aggregate/aggregateUtil/sum";

const getAggregate = (
  byClassificationedRow: AnyUse[],
  matchKeys: MatchKeys,
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
        break;
      case "_count":
        aggregateResult._count = getCount(
          byClassificationedRow,
          matchKeys._count,
        );
        break;
      case "_max":
        aggregateResult._max = getMax(byClassificationedRow, matchKeys._max);
        break;
      case "_min":
        aggregateResult._min = getMin(byClassificationedRow, matchKeys._min);
        break;
      case "_sum":
        aggregateResult._sum = getSum(byClassificationedRow, matchKeys._sum);
        break;
    }
  });

  return aggregateResult;
};

export { getAggregate };
