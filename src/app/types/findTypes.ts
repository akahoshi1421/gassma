import { AnyUse, ManyReturn, OrderBy, Select, WhereUse } from "./coreTypes";

type FindData = {
  where?: WhereUse;
  select?: Select;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
  distinct?: string | string[];
};

type UpdateData = {
  where?: WhereUse;
  data: AnyUse;
};

type UpsertData = {
  where: WhereUse;
  update: AnyUse;
  create: AnyUse;
};

type DeleteData = {
  where: WhereUse;
};

type UpdateManyReturn = ManyReturn;
type DeleteManyReturn = ManyReturn;
type UpsertManyReturn = ManyReturn;

export {
  FindData,
  UpdateData,
  DeleteData,
  UpsertData,
  UpdateManyReturn,
  DeleteManyReturn,
  UpsertManyReturn,
};
