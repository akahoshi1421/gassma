import type { AnyUse, ManyReturn, QueryOmit, Select } from "./coreTypes";
import type { IncludeData } from "./relationTypes";

type CreateData = {
  data: AnyUse;
  select?: Select;
  omit?: QueryOmit;
  include?: IncludeData;
};

type CreateManyData = {
  data: AnyUse[];
};

type CreateManyAndReturnData = {
  data: AnyUse[];
  select?: Select;
  omit?: QueryOmit;
  include?: IncludeData;
};

type CreateManyReturn = ManyReturn;

export type {
  CreateData,
  CreateManyData,
  CreateManyAndReturnData,
  CreateManyReturn,
};
