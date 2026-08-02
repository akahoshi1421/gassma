import type { OrderBy, WhereUse } from "./coreTypes";

type CountAggregateSelect = {
  [key: string]: boolean;
};

type CountData = {
  where?: WhereUse;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  cursor?: Record<string, unknown>;
  select?: CountAggregateSelect | true;
};

export type { CountData, CountAggregateSelect };
