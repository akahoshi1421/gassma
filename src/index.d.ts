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
    create(createdData: CreateData): AnyUse;
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
    take?: number;
    select?: Select;
    omit?: Omit;
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

  type RelationContext = {
    relations: { [relationName: string]: RelationDefinition };
    findManyOnSheet: (
      sheetName: string,
      findData: { where?: WhereUse },
    ) => Record<string, unknown>[];
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
  class WhereRelationInvalidFilterError extends Error {
    constructor(relationName: string, relationType: string, filterType: string);
  }
  class WhereRelationWithoutContextError extends Error {
    constructor();
  }
}

export { Gassma };
