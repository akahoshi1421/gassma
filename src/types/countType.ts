import type { OrderBy, WhereUse } from "./coreTypes";

type CountData = {
  where?: WhereUse;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  cursor?: Record<string, unknown>;
};

export type { CountData };
