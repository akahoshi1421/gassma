import type { OrderBy, Select, WhereUse } from "./coreTypes";

type AggregateData = {
  where?: WhereUse;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  cursor?: Record<string, unknown>;
  _avg?: Select;
  _count?: Select;
  _max?: Select;
  _min?: Select;
  _sum?: Select;
};

export type { AggregateData };
