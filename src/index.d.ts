declare namespace Gassma {
  const skip: unique symbol;

  type SkipValue = typeof skip;

  class FieldRef {
    readonly modelName: string;
    readonly name: string;
    constructor(modelName: string, name: string);
  }

  type QueryHookParams = {
    model: string;
    operation: string;
    args: any;
    query: (args: any) => any;
  };

  type QueryHook = (params: QueryHookParams) => any;

  type QueryHookRecord = {
    [operationName: string]: QueryHook;
  };

  type QueryExtensionConfig = {
    [modelName: string]: QueryHookRecord;
  };

  type ResultFieldDefinition = {
    needs?: { [fieldName: string]: boolean };
    compute: (record: any) => any;
  };

  type ResultFieldRecord = {
    [fieldName: string]: ResultFieldDefinition;
  };

  type ResultExtensionConfig = {
    [modelName: string]: ResultFieldRecord;
  };

  type GassmaExtension = {
    query?: QueryExtensionConfig;
    result?: ResultExtensionConfig;
  };

  type GassmaClient = {
    $extends(extension: GassmaExtension): GassmaClient;
  } & GassmaSheet;

  const GassmaClient: new (
    idOrOptions?: string | GassmaClientOptions,
  ) => GassmaClient;

  class GassmaController {
    constructor(sheetName: string, id?: string);

    readonly fields: Record<string, FieldRef>;
    getColumnHeaders(): string[];
    changeSettings(
      startRowNumber: number,
      startColumnNumber: number,
      endColumnNumber: number,
    ): void;
    createMany(createdData: CreateManyData): CreateManyReturn;
    createManyAndReturn(
      createdData: CreateManyAndReturnData,
    ): Record<string, unknown>[];
    create(createdData: CreateData): Record<string, unknown>;
    findFirst(findData: FindFirstData): Record<string, any>;
    findFirstOrThrow(findData: FindFirstData): Record<string, any>;
    findMany(findData: FindData): Record<string, any>[];
    update(updateData: UpdateSingleData): Record<string, unknown> | null;
    updateMany(updateData: UpdateData): UpdateManyReturn;
    updateManyAndReturn(updateData: UpdateData): Record<string, unknown>[];
    upsert(upsertData: UpsertSingleData): Record<string, unknown>;
    delete(deleteData: DeleteSingleData): Record<string, unknown> | null;
    deleteMany(deleteData: DeleteData): DeleteManyReturn;
    aggregate(aggregateData: AggregateData): Record<string, any>;
    count(countData: CountData): number;
    groupBy(groupByData: GroupByData): Record<string, any>[];
    _setRelationContext(context: RelationContext): void;
    _setGlobalOmit(omit: Omit): void;
    _setDefaults(defaults: {
      [columnName: string]: GassmaAny | (() => GassmaAny);
    }): void;
    _setUpdatedAt(fields: string[]): void;
    _setAutoincrement(fields: string[]): void;
    _setIgnore(fields: string[]): void;
    _setMap(mapping: { [codeName: string]: string }): void;
    _setStrictUndefinedChecks(enabled: boolean): void;
  }

  type GassmaSheet = {
    [key: string]: GassmaController;
  };

  type GassmaAny = string | number | boolean | Date;

  type SortOrderInput = {
    sort: "asc" | "desc";
    nulls?: "first" | "last";
  };

  type RelationOrderBy = {
    [key: string]: "asc" | "desc";
  };

  type OrderBy = {
    [key: string]:
      | "asc"
      | "desc"
      | SortOrderInput
      | RelationOrderBy
      | SkipValue;
  };

  type Select = {
    [key: string]: true | SkipValue;
  };

  type Omit = {
    [key: string]: true;
  };

  type NumberOperation = {
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  type AnyUse = {
    [key: string]: GassmaAny | SkipValue;
  };

  type UpdateAnyUse = {
    [key: string]: GassmaAny | NumberOperation | SkipValue;
  };

  type WhereUse = {
    [key: string]:
      | GassmaAny
      | null
      | FilterConditions
      | WhereUse[]
      | WhereUse
      | undefined
      | SkipValue;
    AND?: WhereUse[] | WhereUse | SkipValue;
    OR?: WhereUse[] | SkipValue;
    NOT?: WhereUse[] | WhereUse | SkipValue;
  };

  type FilterConditions = {
    equals?: GassmaAny | FieldRef | SkipValue;
    not?: GassmaAny | SkipValue;
    in?: GassmaAny[] | SkipValue;
    notIn?: GassmaAny[] | SkipValue;
    lt?: GassmaAny | FieldRef | SkipValue;
    lte?: GassmaAny | FieldRef | SkipValue;
    gt?: GassmaAny | FieldRef | SkipValue;
    gte?: GassmaAny | FieldRef | SkipValue;
    contains?: string | FieldRef | SkipValue;
    startsWith?: string | FieldRef | SkipValue;
    endsWith?: string | FieldRef | SkipValue;
    mode?: "default" | "insensitive" | SkipValue;
  };

  type CreateData = {
    data: AnyUse;
    select?: Select | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    include?: IncludeData | SkipValue;
  };

  type CreateManyData = {
    data: AnyUse[];
  };

  type CreateManyAndReturnData = {
    data: AnyUse[];
    select?: Select | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    include?: IncludeData | SkipValue;
  };

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
    where?: WhereUse | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    skip?: number | SkipValue;
    take?: number | SkipValue;
    select?: Select | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    include?: IncludeData | SkipValue;
  };

  type CountSelectItem = true | { where?: WhereUse };
  type CountSelect = { select: { [relationName: string]: CountSelectItem } };
  type CountValue = true | CountSelect;

  type IncludeData = {
    [relationName: string]: true | IncludeItemOptions | CountValue | SkipValue;
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

  type DefaultsConfig = {
    [sheetName: string]: {
      [columnName: string]: GassmaAny | (() => GassmaAny);
    };
  };

  type UpdatedAtConfig = {
    [sheetName: string]: string | string[];
  };

  type GlobalOmitConfig = {
    [sheetName: string]: Omit;
  };

  type AutoincrementConfig = {
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
    autoincrement?: AutoincrementConfig;
    ignore?: IgnoreConfig;
    ignoreSheets?: IgnoreSheetsConfig;
    map?: MapConfig;
    mapSheets?: MapSheetsConfig;
    strictUndefinedChecks?: boolean;
  };

  type ConnectOrCreateInput = {
    where: WhereUse;
    create: Record<string, unknown>;
  };

  type NestedUpdateInput = {
    where: WhereUse;
    data: Record<string, unknown>;
  };

  type NestedWriteOperation = {
    create?: Record<string, unknown> | Record<string, unknown>[];
    createMany?: { data: AnyUse[] };
    connect?: WhereUse | WhereUse[];
    connectOrCreate?: ConnectOrCreateInput | ConnectOrCreateInput[];
    update?: Record<string, unknown> | NestedUpdateInput | NestedUpdateInput[];
    delete?: boolean | WhereUse | WhereUse[];
    deleteMany?: WhereUse | WhereUse[];
    disconnect?: boolean | WhereUse | WhereUse[];
    set?: WhereUse[];
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

  type FindSelect = {
    [key: string]: true | IncludeItemOptions | CountValue | SkipValue;
  };

  type FindFirstData = {
    where?: WhereUse | SkipValue;
    select?: FindSelect | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    distinct?: string | string[] | SkipValue;
    include?: IncludeData | SkipValue;
    cursor?: Record<string, unknown> | SkipValue;
  };

  type FindData = {
    where?: WhereUse | SkipValue;
    select?: FindSelect | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    distinct?: string | string[] | SkipValue;
    include?: IncludeData | SkipValue;
    cursor?: Record<string, unknown> | SkipValue;
  };

  type UpdateSingleData = {
    where: WhereUse;
    data: Record<string, unknown>;
    select?: Select | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    include?: IncludeData | SkipValue;
  };

  type DeleteSingleData = {
    where: WhereUse;
    select?: Select | SkipValue;
    include?: IncludeData | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
  };

  type UpsertSingleData = {
    where: WhereUse;
    create: AnyUse;
    update: UpdateAnyUse;
    select?: Select | SkipValue;
    include?: IncludeData | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
  };

  type DeleteData = {
    where?: WhereUse | SkipValue;
    limit?: number | SkipValue;
  };

  type UpdateData = {
    where?: WhereUse | SkipValue;
    data: UpdateAnyUse;
    limit?: number | SkipValue;
  };

  type AggregateData = {
    where?: WhereUse | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    cursor?: Record<string, unknown> | SkipValue;
    _avg?: Select | SkipValue;
    _count?: Select | SkipValue;
    _max?: Select | SkipValue;
    _min?: Select | SkipValue;
    _sum?: Select | SkipValue;
  };

  type CountData = {
    where?: WhereUse | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    cursor?: Record<string, unknown> | SkipValue;
  };

  type NumberFilterConditions = {
    equals?: number | null;
    not?: number | null;
    in?: number[];
    notIn?: number[];
    lt?: number;
    lte?: number;
    gt?: number;
    gte?: number;
  };

  type HavingCore = {
    _avg?: NumberFilterConditions;
    _count?: NumberFilterConditions;
    _max?: FilterConditions;
    _min?: FilterConditions;
    _sum?: NumberFilterConditions;
  } & FilterConditions;

  type HavingUse = {
    [key: string]: HavingCore | HavingUse[] | HavingUse | GassmaAny;
    AND?: HavingUse[] | HavingUse;
    OR?: HavingUse[];
    NOT?: HavingUse[] | HavingUse;
  };

  type GroupByData = {
    where?: WhereUse | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    _avg?: Select | SkipValue;
    _count?: Select | SkipValue;
    _max?: Select | SkipValue;
    _min?: Select | SkipValue;
    _sum?: Select | SkipValue;
    by: string[] | string;
    having?: HavingUse | SkipValue;
  };

  type ManyReturn = {
    count: number;
  };

  type CreateManyReturn = ManyReturn;
  type UpdateManyReturn = ManyReturn;
  type DeleteManyReturn = ManyReturn;

  class GassmaSkipNegativeError extends Error {
    constructor(value: number);
  }
  class GassmaFindFirstTakeError extends Error {
    constructor();
  }
  class GassmaLimitNegativeError extends Error {
    constructor(value: number);
  }
  class NotFoundError extends Error {
    constructor();
  }
  class RelationSheetNotFoundError extends Error {
    constructor(sheetName: string);
  }
  class RelationMissingPropertyError extends Error {
    constructor(sheetName: string, relationName: string, property: string);
  }
  class RelationInvalidPropertyTypeError extends Error {
    constructor(
      sheetName: string,
      relationName: string,
      property: string,
      expectedType: string,
    );
  }
  class RelationInvalidTypeError extends Error {
    constructor(sheetName: string, relationName: string, value: string);
  }
  class RelationColumnNotFoundError extends Error {
    constructor(sheetName: string, columnName: string);
  }
  class IncludeWithoutRelationsError extends Error {
    constructor();
  }
  class IncludeInvalidOptionTypeError extends Error {
    constructor(relationName: string, option: string, expectedType: string);
  }
  class IncludeSelectOmitConflictError extends Error {
    constructor(relationName: string);
  }
  class IncludeSelectIncludeConflictError extends Error {
    constructor(relationName: string);
  }
  class WhereRelationInvalidFilterError extends Error {
    constructor(relationName: string, relationType: string, filterType: string);
  }
  class WhereRelationWithoutContextError extends Error {
    constructor();
  }
  class RelationOnDeleteRestrictError extends Error {
    constructor(relationName: string);
  }
  class RelationInvalidOnDeleteError extends Error {
    constructor(sheetName: string, relationName: string, value: string);
  }
  class RelationOnUpdateRestrictError extends Error {
    constructor(relationName: string);
  }
  class RelationInvalidOnUpdateError extends Error {
    constructor(sheetName: string, relationName: string, value: string);
  }
  class NestedWriteConnectNotFoundError extends Error {
    constructor(sheetName: string);
  }
  class NestedWriteRelationNotFoundError extends Error {
    constructor(fieldName: string);
  }
  class NestedWriteInvalidOperationError extends Error {
    constructor(relationName: string, operation: string, relationType: string);
  }
  class NestedWriteWithoutRelationsError extends Error {
    constructor();
  }
  class NestedWriteTargetNotFoundError extends Error {
    constructor(sheetName: string, operation: string);
  }
  class RelationOrderByUnsupportedTypeError extends Error {
    constructor(relationName: string, relationType: string);
  }
  class RelationOrderByCountUnsupportedTypeError extends Error {
    constructor(relationName: string, relationType: string);
  }
  class GassmaUndefinedValueError extends Error {
    constructor(path: string);
  }
  class GassmaSkipInArrayError extends Error {
    constructor(path: string);
  }
  class GassmaUpdateWhereMissingError extends Error {
    constructor();
  }
}

export { Gassma };
