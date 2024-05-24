import { AnyUse, OrderBy, Select, WhereUse } from "./coreTypes";

type FindData = {
  where?: WhereUse;
  select?: Select;
  orderBy?: OrderBy | OrderBy[];
  take?: number;
  skip?: number;
};

type UpdateData = {
  where: WhereUse;
  data: AnyUse;
};

type UpsertData = {
  where: WhereUse;
  update: AnyUse;
  create: AnyUse;
};

type DeleteData = FindData;

export { FindData, UpdateData, DeleteData, UpsertData };
