type OrderBy = {
  [key: string]: "asc" | "desc";
};

type Select = {
  [key: string]: true;
};

type AnyUse = {
  [key: string]: any;
};

type WhereUse = {
  [key: string]: any | FilterConditions;
  AND?: WhereUse[] | WhereUse;
  OR?: WhereUse[];
  NOT?: WhereUse[] | WhereUse;
};

type FilterConditions = {
  equals?: any;
  not?: any;
  in?: any[];
  notIn?: any[];
  lt?: any;
  lte?: any;
  gt?: any;
  gte?: any;
  contains?: String;
  startsWith?: String;
  endsWith?: String;
};

export { OrderBy, Select, AnyUse, FilterConditions, WhereUse };
