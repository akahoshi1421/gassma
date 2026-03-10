import type {
  AnyUse,
  GassmaAny,
  Omit,
  OrderBy,
  Select,
  WhereUse,
} from "./coreTypes";

type RelationType = "oneToMany" | "oneToOne" | "manyToOne" | "manyToMany";

type OnDeleteAction = "Cascade" | "SetNull" | "Restrict" | "NoAction";

type OnUpdateAction = "Cascade" | "SetNull" | "Restrict" | "NoAction";

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
  onUpdate?: OnUpdateAction;
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
  include?: IncludeData;
};

type CountSelectItem = true | { where?: WhereUse };
type CountSelect = { select: { [relationName: string]: CountSelectItem } };
type CountValue = true | CountSelect;

type IncludeData = {
  [relationName: string]: true | IncludeItemOptions;
};

type GlobalOmitConfig = {
  [sheetName: string]: Omit;
};

type DefaultsConfig = {
  [sheetName: string]: {
    [columnName: string]: GassmaAny | (() => GassmaAny);
  };
};

type UpdatedAtConfig = {
  [sheetName: string]: string | string[];
};

type IgnoreConfig = {
  [sheetName: string]: string | string[];
};

type IgnoreSheetsConfig = string | string[];

type MapConfig = {
  [sheetName: string]: {
    [codeName: string]: string;
  };
};

type MapSheetsConfig = {
  [codeName: string]: string;
};

type GassmaClientOptions = {
  id?: string;
  relations?: RelationsConfig;
  omit?: GlobalOmitConfig;
  defaults?: DefaultsConfig;
  updatedAt?: UpdatedAtConfig;
  ignore?: IgnoreConfig;
  ignoreSheets?: IgnoreSheetsConfig;
  map?: MapConfig;
  mapSheets?: MapSheetsConfig;
};

type RelationContext = {
  relations: { [relationName: string]: RelationDefinition };
  findManyOnSheet: (
    sheetName: string,
    findData: { where?: WhereUse; include?: IncludeData },
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
  OnUpdateAction,
  ManyToManyThrough,
  RelationDefinition,
  RelationsConfig,
  IncludeItemOptions,
  CountSelectItem,
  CountSelect,
  CountValue,
  IncludeData,
  DefaultsConfig,
  UpdatedAtConfig,
  IgnoreConfig,
  IgnoreSheetsConfig,
  MapConfig,
  MapSheetsConfig,
  GlobalOmitConfig,
  GassmaClientOptions,
  RelationContext,
  RelationListFilter,
  RelationSingleFilter,
  WhereRelationFilter,
};
