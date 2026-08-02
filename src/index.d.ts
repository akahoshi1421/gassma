declare namespace Gassma {
  const skip: unique symbol;

  type SkipValue = typeof skip;

  type RawValue = {
    readonly __gassmaRawValueBrand: "Gassma.raw";
  };

  /**
   * Writes the value to the cell as-is, skipping formula-injection escaping.
   * A string starting with `=` therefore becomes a live spreadsheet formula.
   *
   * Susceptible to formula injection: never pass unsanitized user input.
   *
   * @example
   * ```
   * gassma.Report.create({
   *   data: { title: userInput, total: Gassma.raw("=SUM(B2:B10)") },
   * });
   * ```
   */
  function raw(value: string): RawValue;

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

  type ExtendedGassmaClient = {
    $extends(extension: GassmaExtension): ExtendedGassmaClient;
  } & GassmaSheet;

  type GassmaTransactionOptions = {
    maxWait?: number;
    timeout?: number;
    rollback?: boolean;
  };

  type GassmaTransactionClient = {
    $extends(extension: GassmaExtension): ExtendedGassmaClient;
  } & GassmaSheet;

  type GassmaClient = {
    $extends(extension: GassmaExtension): ExtendedGassmaClient;
    $transaction<T>(
      fn: (tx: GassmaTransactionClient) => T,
      options?: GassmaTransactionOptions,
    ): T;
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
      startColumnValue: number | string,
      endColumnValue: number | string,
    ): void;
    createMany(createdData: CreateManyData): CreateManyReturn;
    createManyAndReturn(
      createdData: CreateManyAndReturnData,
    ): Record<string, unknown>[];
    create(createdData: CreateData): Record<string, unknown>;
    findFirst(findData?: FindFirstData): Record<string, any>;
    findFirstOrThrow(findData?: FindFirstData): Record<string, any>;
    findMany(findData?: FindData): Record<string, any>[];
    update(updateData: UpdateSingleData): Record<string, unknown> | null;
    updateMany(updateData: UpdateData): UpdateManyReturn;
    updateManyAndReturn(
      updateData: UpdateManyAndReturnData,
    ): Record<string, unknown>[];
    upsert(upsertData: UpsertSingleData): Record<string, unknown>;
    delete(deleteData: DeleteSingleData): Record<string, unknown> | null;
    deleteMany(deleteData?: DeleteData): DeleteManyReturn;
    aggregate(aggregateData: AggregateData): Record<string, any>;
    count<T extends CountData>(
      countData?: T,
    ): T extends { select: infer S }
      ? S extends true
        ? number
        : { [K in keyof S]: number }
      : number;
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
    [key: string]: GassmaAny | RawValue | SkipValue;
  };

  type UpdateAnyUse = {
    [key: string]: GassmaAny | NumberOperation | RawValue | SkipValue;
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

  type MigrateModel = {
    name: string;
    columns: string[];
  };

  type MigrateSheetsOptions = {
    spreadsheetId?: string;
    models: MigrateModel[];
    acceptDataLoss?: boolean;
  };

  /**
   * Synchronizes the spreadsheet with the given models like `prisma db push`:
   * missing sheets are created and missing columns are appended, idempotently.
   * Assumes the header row is row 1 starting at column A on every sheet
   * (header positions moved via changeSettings are not supported).
   * Columns and sheets not in the schema are only warned about by default;
   * with `acceptDataLoss: true` they are dropped after a warning that reports
   * how much data they still contain (silently when they are empty; the last
   * remaining sheet is kept, since a spreadsheet must contain at least one
   * sheet). Never reorders existing columns, never writes to data rows.
   */
  function migrateSheets(options: MigrateSheetsOptions): void;

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

  type UpdateManyAndReturnData = {
    where?: WhereUse | SkipValue;
    data: UpdateAnyUse;
    limit?: number | SkipValue;
    select?: Select | SkipValue;
    omit?: Record<string, boolean> | SkipValue;
    include?: IncludeData | SkipValue;
  };

  type AggregateData = {
    where?: WhereUse | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    cursor?: Record<string, unknown> | SkipValue;
    _avg?: Select | SkipValue;
    _count?: Select | true | SkipValue;
    _max?: Select | SkipValue;
    _min?: Select | SkipValue;
    _sum?: Select | SkipValue;
  };

  type CountAggregateSelect = {
    [key: string]: true | SkipValue;
  };

  type CountData = {
    where?: WhereUse | SkipValue;
    orderBy?: OrderBy | OrderBy[] | SkipValue;
    take?: number | SkipValue;
    skip?: number | SkipValue;
    cursor?: Record<string, unknown> | SkipValue;
    select?: CountAggregateSelect | true | SkipValue;
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
    _count?: Select | true | SkipValue;
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
  class RelationIgnoredColumnError extends Error {
    constructor(
      sheetName: string,
      relationName: string,
      columnName: string,
      ignoredSheetName: string,
    );
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
  class GassmaMissingArgumentError extends Error {
    constructor(argumentName: string);
  }
  class GassmaUnknownArgumentError extends Error {
    constructor(argumentName: string, availableArguments: string[]);
  }
  class GassmaInvalidValueError extends Error {
    constructor(argumentName: string, expected: string);
  }
  class GassmaFindSelectOmitConflictError extends Error {
    constructor();
  }
  class GassmaInValidColumnValueError extends Error {
    constructor();
  }
  class GassmaGroupByHavingDontWriteByError extends Error {
    constructor();
  }
  class GassmaAggregateMaxError extends Error {
    constructor();
  }
  class GassmaAggregateMinError extends GassmaAggregateMaxError {
    constructor();
  }
  class GassmaAggregateSumError extends GassmaAggregateMaxError {
    constructor();
  }
  class GassmaAggregateAvgError extends GassmaAggregateMaxError {
    constructor();
  }
  class GassmaAggregateTypeError extends Error {
    constructor();
  }
  class GassmaAggregateSumTypeError extends Error {
    constructor();
  }
  class GassmaAggregateAvgTypeError extends GassmaAggregateSumTypeError {
    constructor();
  }
  class GassmaAggregateSelectionRequiredError extends Error {
    constructor();
  }
  class GassmaRelationNotFoundError extends Error {
    constructor(relationName: string, sheetName: string);
  }
  class GassmaThroughRequiredError extends Error {
    constructor(relationName: string);
  }
  class GassmaIncludeSelectConflictError extends Error {
    constructor();
  }
  class GassmaRelationDuplicateError extends Error {
    constructor(sheetName: string, field: string, value: unknown);
  }
  class GassmaTransactionLockTimeoutError extends Error {
    constructor(maxWaitMs: number);
  }
  class GassmaTransactionTimeoutError extends Error {
    constructor(
      phase: "query" | "commit",
      timeoutMs: number,
      elapsedMs: number,
    );
  }
  class GassmaNestedTransactionError extends Error {
    constructor();
  }
  class GassmaTransactionRollbackError extends Error {
    constructor(backupSheetNames: string[]);
    readonly backupSheetNames: string[];
  }
}

export { Gassma };
