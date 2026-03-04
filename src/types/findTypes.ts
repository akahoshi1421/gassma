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

type FindData = {
  where?: WhereUse;
  select?: Select;
  omit?: Omit;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  distinct?: string | string[];
  include?: IncludeData;
};

type UpdateData = {
  where?: WhereUse;
  data: UpdateAnyUse;
  limit?: number;
};

type UpsertData = {
  where: WhereUse;
  update: AnyUse;
  create: AnyUse;
};

type DeleteData = {
  where: WhereUse;
  limit?: number;
};

type UpdateManyReturn = ManyReturn;
type DeleteManyReturn = ManyReturn;
type UpsertManyReturn = ManyReturn;

export type {
  FindData,
  UpdateData,
  DeleteData,
  UpsertData,
  UpdateManyReturn,
  DeleteManyReturn,
  UpsertManyReturn,
};
