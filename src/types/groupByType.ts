import type { AggregateData } from "./aggregateType";
import type { HavingUse } from "./coreTypes";

type GroupByData = AggregateData & {
  by: string[] | string;
  having?: HavingUse;
};

export { GroupByData };
