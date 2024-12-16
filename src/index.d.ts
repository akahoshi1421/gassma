declare namespace Gassma {
  class GassmaClient {
    constructor(id?: string);

    readonly sheets: GassmaSheet;
  }

  class GassmaController {
    constructor(sheetName: string, id?: string);

    changeSettings(
      startRowNumber: number,
      startColumnNumber: number,
      endColumnNumber: number
    ): void;
    createMany(createdData: CreateManyData): void;
    create(createdData: CreateData): void;
    findFirst(findData: FindData): {};
    findMany(findData: FindData): {}[];
    updateMany(updateData: UpdateData): void;
    upsert(upsertData: UpsertData): void;
    deleteMany(deleteData: DeleteData): void;
    aggregate(aggregateData: AggregateData): {};
    count(countData: CountData): number;
    groupBy(groupByData: GroupByData): {}[];
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
    contains?: String;
    startsWith?: String;
    endsWith?: String;
  };

  type CreateData = {
    data: AnyUse;
  };

  type CreateManyData = {
    data: AnyUse[];
  };

  type FindData = {
    where?: WhereUse;
    select?: Select;
    orderBy?: OrderBy | OrderBy[];
    take?: number;
    skip?: number;
    distinct?: string | string[];
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
}

export { Gassma };
