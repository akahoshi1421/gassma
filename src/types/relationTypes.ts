import type { AnyUse, Omit, OrderBy, Select, WhereUse } from "./coreTypes";

type RelationType = "oneToMany" | "oneToOne" | "manyToOne" | "manyToMany";

type OnDeleteAction = "Cascade" | "SetNull" | "Restrict" | "NoAction";

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
  onDelete?: OnDeleteAction;
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
  deleteManyOnSheet?: (
    sheetName: string,
    deleteData: { where: WhereUse },
  ) => { count: number };
  updateManyOnSheet?: (
    sheetName: string,
    updateData: { where?: WhereUse; data: AnyUse },
  ) => { count: number };
  createOnSheet?: (
    sheetName: string,
    createData: { data: Record<string, unknown> },
  ) => Record<string, unknown>;
  createManyOnSheet?: (
    sheetName: string,
    createManyData: { data: AnyUse[] },
  ) => { count: number } | undefined;
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
  OnDeleteAction,
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
