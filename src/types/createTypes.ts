import type { AnyUse, ManyReturn, Omit, Select } from "./coreTypes";

type CreateData = {
  data: AnyUse;
  select?: Select;
  omit?: Omit;
};

type CreateManyData = {
  data: AnyUse[];
};

type CreateManyReturn = ManyReturn;

export type { CreateData, CreateManyData, CreateManyReturn };
