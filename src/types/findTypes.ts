import type {
  AnyUse,
  ManyReturn,
  OrderBy,
  QueryOmit,
  Select,
  UpdateAnyUse,
  WhereUse,
} from "./coreTypes";
import type {
  CountValue,
  IncludeData,
  IncludeItemOptions,
} from "./relationTypes";

type FindSelect = {
  [key: string]: true | IncludeItemOptions | CountValue;
};

type FindFirstData = {
  where?: WhereUse;
  select?: FindSelect;
  omit?: QueryOmit;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  distinct?: string | string[];
  include?: IncludeData;
  cursor?: Record<string, unknown>;
};

type FindData = {
  where?: WhereUse;
  select?: FindSelect;
  omit?: QueryOmit;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  distinct?: string | string[];
  include?: IncludeData;
  cursor?: Record<string, unknown>;
};

type UpdateSingleData = {
  where: WhereUse;
  data: Record<string, unknown>;
  select?: Select;
  omit?: QueryOmit;
  include?: IncludeData;
};

type UpdateData = {
  where?: WhereUse;
  data: UpdateAnyUse;
  limit?: number;
};

type UpsertSingleData = {
  where: WhereUse;
  create: AnyUse;
  update: AnyUse;
  select?: Select;
  include?: IncludeData;
  omit?: QueryOmit;
};

type DeleteSingleData = {
  where: WhereUse;
  select?: Select;
  include?: IncludeData;
  omit?: QueryOmit;
};

type DeleteData = {
  where?: WhereUse;
  limit?: number;
};

type UpdateManyReturn = ManyReturn;
type DeleteManyReturn = ManyReturn;
export type {
  FindSelect,
  FindFirstData,
  FindData,
  UpdateSingleData,
  UpdateData,
  UpsertSingleData,
  DeleteSingleData,
  DeleteData,
  UpdateManyReturn,
  DeleteManyReturn,
};
