import type { AnyUse, ManyReturn } from "./coreTypes";

type CreateData = {
  data: AnyUse;
};

type CreateManyData = {
  data: AnyUse[];
};

type CreateManyReturn = ManyReturn;

export type { CreateData, CreateManyData, CreateManyReturn };
