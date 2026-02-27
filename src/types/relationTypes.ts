import type { Omit, OrderBy, Select, WhereUse } from "./coreTypes";

type RelationType = "oneToMany" | "oneToOne" | "manyToOne" | "manyToMany";

type ManyToManyThrough = {
  sheet: string;
  field: string;
  reference: string;
};

type RelationDefinition = {
  type: RelationType;
  to: string;
  field: string;
  reference: string;
  through?: ManyToManyThrough;
};

type RelationsConfig = {
  [sheetName: string]: {
    [relationName: string]: RelationDefinition;
  };
};

type IncludeItemOptions = {
  where?: WhereUse;
  orderBy?: OrderBy | OrderBy[];
  skip?: number;
  take?: number;
  select?: Select;
  omit?: Omit;
};

type IncludeData = {
  [relationName: string]: true | IncludeItemOptions;
};

type GassmaClientOptions = {
  id?: string;
  relations?: RelationsConfig;
};

type RelationContext = {
  relations: { [relationName: string]: RelationDefinition };
  findManyOnSheet: (
    sheetName: string,
    findData: { where?: WhereUse },
  ) => Record<string, unknown>[];
};

type RelationListFilter = {
  some?: WhereUse;
  every?: WhereUse;
  none?: WhereUse;
};

type RelationSingleFilter = {
  is?: WhereUse | null;
  isNot?: WhereUse | null;
};

type WhereRelationFilter = RelationListFilter | RelationSingleFilter;

export type {
  RelationType,
  ManyToManyThrough,
  RelationDefinition,
  RelationsConfig,
  IncludeItemOptions,
  IncludeData,
  GassmaClientOptions,
  RelationContext,
  RelationListFilter,
  RelationSingleFilter,
  WhereRelationFilter,
};
