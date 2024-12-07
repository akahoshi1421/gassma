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
  _avg?: FilterConditions;
  _count?: FilterConditions;
  _max?: FilterConditions;
  _min?: FilterConditions;
  _sum?: FilterConditions;
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

type MatchKeys = {
  _avg?: Select;
  _count?: Select;
  _max?: Select;
  _min?: Select;
  _sum?: Select;
};

type HavingAggregate = {
  _avg?: AnyUse;
  _count?: AnyUse;
  _max?: AnyUse;
  _min?: AnyUse;
  _sum?: AnyUse;
};

type HavingAggregateWithIndex = {
  havingAggregateData: HavingAggregate;
  index: number;
};

type TranspositionHavingAggregate = {
  [key: string]: {
    _avg?: GassmaAny;
    _count?: GassmaAny;
    _max?: GassmaAny;
    _min?: GassmaAny;
    _sum?: GassmaAny;
  };
};

type TranspositionHavingAggregateWithIndex = {
  havingAggregateData: TranspositionHavingAggregate;
  index: number;
};

type HitByClassificationedRowData = {
  rowNumber: number;
  row: AnyUse[];
};

export {
  GassmaAny,
  OrderBy,
  Select,
  AnyUse,
  FilterConditions,
  WhereUse,
  HavingUse,
  MatchKeys,
  HavingAggregate,
  HavingAggregateWithIndex,
  TranspositionHavingAggregate,
  TranspositionHavingAggregateWithIndex,
  HitByClassificationedRowData,
};
