import type { AnyUse, ManyReturn, Omit, Select } from "./coreTypes";
import type { IncludeData } from "./relationTypes";

type CreateData = {
  data: AnyUse;
  select?: Select;
  omit?: Omit;
  include?: IncludeData;
};

type CreateManyData = {
  data: AnyUse[];
};

type CreateManyReturn = ManyReturn;

export type { CreateData, CreateManyData, CreateManyReturn };
