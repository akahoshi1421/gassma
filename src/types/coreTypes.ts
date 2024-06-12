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

export { GassmaAny, OrderBy, Select, AnyUse, FilterConditions, WhereUse };
