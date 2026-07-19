import type { AggregateData } from "./aggregateType";
import type { HavingUse } from "./coreTypes";

type GroupByData = Omit<AggregateData, "cursor"> & {
  by: string[] | string;
  having?: HavingUse;
};

export type { GroupByData };
