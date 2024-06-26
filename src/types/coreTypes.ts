type GassmaAny = string | number | boolean | Date;

type OrderBy = {
  [key: string]: "asc" | "desc";
};

type Select = {
  [key: string]: true;
};

type AnyUse = {
  [key: string]: GassmaAny;
};

type WhereUse = {
  [key: string]:
    | GassmaAny
    | WhereUse
    | WhereUse[]
    | undefined
    | FilterConditions;
  AND?: WhereUse[] | WhereUse;
  OR?: WhereUse[];
  NOT?: WhereUse[] | WhereUse;
};

type HavingCore = {
  _avg?: number | FilterConditions;
  _count?: number | FilterConditions;
  _max?: GassmaAny | FilterConditions;
  _min?: GassmaAny | FilterConditions;
  _sum?: number | FilterConditions;
};

type HavingUse = {
  [key: string]: HavingCore | HavingUse[] | HavingUse;
  AND?: HavingUse[] | HavingUse;
  OR?: HavingUse[];
  NOT?: HavingUse[] | HavingUse;
};

type FilterConditions = {
  equals?: GassmaAny;
  not?: GassmaAny;
  in?: GassmaAny[];
  notIn?: GassmaAny[];
  lt?: GassmaAny;
  lte?: GassmaAny;
  gt?: GassmaAny;
  gte?: GassmaAny;
  contains?: String;
  startsWith?: String;
  endsWith?: String;
};

export {
  GassmaAny,
  OrderBy,
  Select,
  AnyUse,
  FilterConditions,
  WhereUse,
  HavingUse,
};
