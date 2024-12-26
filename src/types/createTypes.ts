import { AnyUse } from "./coreTypes";

type CreateData = {
  data: AnyUse;
};

type CreateManyData = {
  data: AnyUse[];
};

type CreateManyReturn = {
  count: number;
};

export { CreateData, CreateManyData, CreateManyReturn };
