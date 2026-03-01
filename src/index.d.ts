declare namespace Gassma {
  class GassmaClient {
    constructor(idOrOptions?: string | GassmaClientOptions);

    readonly sheets: GassmaSheet;
  }

  class GassmaController {
    constructor(sheetName: string, id?: string);

    getColumnHeaders(): string[];
    changeSettings(
      startRowNumber: number,
      startColumnNumber: number,
      endColumnNumber: number,
    ): void;
    createMany(createdData: CreateManyData): CreateManyReturn;
    createManyAndReturn(createdData: CreateManyData): Record<string, unknown>[];
    create(createdData: CreateData): Record<string, unknown>;
    findFirst(findData: FindData): Record<string, any>;
    findMany(findData: FindData): Record<string, any>[];
    updateMany(updateData: UpdateData): UpdateManyReturn;
    upsert(upsertData: UpsertData): UpdateManyReturn;
    deleteMany(deleteData: DeleteData): DeleteManyReturn;
    aggregate(aggregateData: AggregateData): Record<string, any>;
    count(countData: CountData): number;
    groupBy(groupByData: GroupByData): Record<string, any>[];
    _setRelationContext(context: RelationContext): void;
  }

  type GassmaSheet = {
    [key: string]: GassmaController;
  };

  type GassmaAny = string | number | boolean | Date;

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
      | FilterConditions
      | WhereUse[]
      | WhereUse
      | undefined;
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
    contains?: string;
    startsWith?: string;
    endsWith?: string;
  };

  type CreateData = {
    data: AnyUse;
  };

  type CreateManyData = {
    data: AnyUse[];
  };

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
    include?: IncludeData;
  };

  type IncludeData = {
    [relationName: string]: true | IncludeItemOptions;
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

  type GassmaClientOptions = {
    id?: string;
    relations?: RelationsConfig;
  };

  type ConnectOrCreateInput = {
    where: WhereUse;
    create: Record<string, unknown>;
  };

  type NestedWriteOperation = {
    create?: Record<string, unknown> | Record<string, unknown>[];
    createMany?: { data: AnyUse[] };
    connect?: WhereUse | WhereUse[];
    connectOrCreate?: ConnectOrCreateInput | ConnectOrCreateInput[];
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

  type FindData = {
    where?: WhereUse;
    select?: Select;
    omit?: Omit;
    orderBy?: OrderBy | OrderBy[];
    take?: number;
    skip?: number;
    distinct?: string | string[];
    include?: IncludeData;
  };

  type DeleteData = {
    where: WhereUse;
  };

  type UpdateData = {
    where?: WhereUse;
    data: AnyUse;
  };

  type UpsertData = {
    where: WhereUse;
    update: AnyUse;
    create: AnyUse;
  };

  type AggregateData = {
    where?: WhereUse;
    orderBy?: OrderBy | OrderBy[];
    take?: number;
    skip?: number;
    _avg?: Select;
    _count?: Select;
    _max?: Select;
    _min?: Select;
    _sum?: Select;
  };

  type CountData = {
    where?: WhereUse;
    orderBy?: OrderBy | OrderBy[];
    take?: number;
    skip?: number;
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

  type GroupByData = AggregateData & {
    by: string[] | string;
    having?: HavingUse;
  };

  type ManyReturn = {
    count: number;
  };

  type CreateManyReturn = ManyReturn;
  type UpdateManyReturn = ManyReturn;
  type DeleteManyReturn = ManyReturn;
  type UpsertManyReturn = ManyReturn;

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
}

export { Gassma };
