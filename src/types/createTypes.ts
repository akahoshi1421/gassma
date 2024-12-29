import { AnyUse, ManyReturn } from "./coreTypes";

type CreateData = {
  data: AnyUse;
};

type CreateManyData = {
  data: AnyUse[];
};

type CreateManyReturn = ManyReturn;

export { CreateData, CreateManyData, CreateManyReturn };
