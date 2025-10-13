import type { OrderBy, WhereUse } from "./coreTypes";

type CountData = {
  where?: WhereUse;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
};

export { CountData };
