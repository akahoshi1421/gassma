import { AggregateData } from "./aggregateType";
import { HavingUse } from "./coreTypes";

type GroupByData = AggregateData & {
  by: string[] | string;
  having?: HavingUse[] | HavingUse;
};

export { GroupByData };
