import { AnyUse, OrderBy, Select } from "./coreTypes";

type FindData = {
  where?: AnyUse;
  select?: Select;
  orderBy?: OrderBy | OrderBy[];
};

type UpdateData = {
  where: AnyUse;
  data: AnyUse;
};

type UpsertData = {
  where: AnyUse;
  update: AnyUse;
  create: AnyUse;
};

type DeleteData = FindData;

export { FindData, UpdateData, DeleteData, UpsertData };
