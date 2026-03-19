import type {
  AnyUse,
  ManyReturn,
  Omit,
  OrderBy,
  Select,
  UpdateAnyUse,
  WhereUse,
} from "./coreTypes";
import type { IncludeData } from "./relationTypes";

type FindFirstData = {
  where?: WhereUse;
  select?: Select;
  omit?: Omit;
  orderBy?: OrderBy | OrderBy[];
  include?: IncludeData;
  cursor?: Record<string, unknown>;
};

type FindData = {
  where?: WhereUse;
  select?: Select;
  omit?: Omit;
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
  omit?: Omit;
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
  omit?: Omit;
};

type DeleteSingleData = {
  where: WhereUse;
  select?: Select;
  include?: IncludeData;
  omit?: Omit;
};

type DeleteData = {
  where?: WhereUse;
  limit?: number;
};

type UpdateManyReturn = ManyReturn;
type DeleteManyReturn = ManyReturn;
export type {
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
