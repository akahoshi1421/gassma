type GassmaAny = string | number | boolean | Date | null;

type OrderBy = {
  [key: string]: "asc" | "desc";
};

type Select = {
  [key: string]: true;
};

type Omit = {
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
} & FilterConditions;

type HavingUse = {
  [key: string]: HavingCore | HavingUse[] | HavingUse | GassmaAny;
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
  contains?: string;
  startsWith?: string;
  endsWith?: string;
};

type MatchKeys = {
  _avg?: Select;
  _count?: Select;
  _max?: Select;
  _min?: Select;
  _sum?: Select;
};

type MatchFilterConditionsKeys = {
  equals?: AnyUse;
  not?: AnyUse;
  in?: { [key: string]: GassmaAny[] };
  notIn?: { [key: string]: GassmaAny[] };
  lt?: AnyUse;
  lte?: AnyUse;
  gt?: AnyUse;
  gte?: AnyUse;
  contains?: { [key: string]: string };
  startsWith?: { [key: string]: string };
  endsWith?: { [key: string]: string };
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

type TranspositionHavingConditionKeys = {
  [key: string]: FilterConditions;
};

type ManyReturn = {
  count: number;
};

export {
  GassmaAny,
  OrderBy,
  Select,
  Omit,
  AnyUse,
  FilterConditions,
  WhereUse,
  HavingCore,
  HavingUse,
  MatchKeys,
  MatchFilterConditionsKeys,
  HavingAggregate,
  HavingAggregateWithIndex,
  TranspositionHavingAggregate,
  TranspositionHavingAggregateWithIndex,
  HitByClassificationedRowData,
  TranspositionHavingConditionKeys,
  ManyReturn,
};
