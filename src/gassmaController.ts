import { NotFoundError } from "./errors/find/findError";
import { FieldRef } from "./util/filterConditions/fieldRef";
import { GassmaIncludeSelectConflictError } from "./errors/relation/relationError";
import { IncludeWithoutRelationsError } from "./errors/relation/relationValidationError";
import type { AggregateData } from "./types/aggregateType";
import type { AnyUse, Select, Omit, WhereUse } from "./types/coreTypes";
import type { CountData } from "./types/countType";
import type { CreateData, CreateManyData } from "./types/createTypes";
import type {
  DeleteData,
  FindData,
  UpdateData,
  UpsertData,
} from "./types/findTypes";
import type { GassmaControllerUtil } from "./types/gassmaControllerUtilType";
import type { GroupByData } from "./types/groupByType";
import type { IncludeData, RelationContext } from "./types/relationTypes";
import { aggregateFunc } from "./util/aggregate/aggregate";
import { changeSettingsFunc } from "./util/changeSettings/changeSettings";
import { getTitle } from "./util/core/getTitle";
import { countFunc } from "./util/count/count";
import { createFunc } from "./util/create/create";
import { createManyFunc } from "./util/create/createManyFunc";
import { resolveNestedCreate } from "./util/create/nestedWrite/resolveNestedCreate";
import { deleteFunc } from "./util/delete/delete";
import { deleteManyFunc } from "./util/delete/deleteMany";
import { findFirstFunc } from "./util/find/findFirst";
import { findManyFunc } from "./util/find/findMany";
import { groupByFunc } from "./util/groupby/groupby";
import { resolveOnDelete } from "./util/relation/onDelete/resolveOnDelete";
import { resolveOnUpdate } from "./util/relation/onUpdate/resolveOnUpdate";
import { resolveInclude } from "./util/relation/resolveInclude";
import { applySelectCount } from "./util/find/findUtil/applySelectCount";
import { resolveWhereRelation } from "./util/relation/whereRelation/resolveWhereRelation";
import { resolveNestedUpdate } from "./util/update/nestedWrite/resolveNestedUpdate";
import { updateManyFunc } from "./util/update/updateMany";
import { resolveNumberOperations } from "./util/update/resolveNumberOperation";
import { upsertFunc } from "./util/upsert/upsert";
import { upsertManyFunc } from "./util/upsert/upsertMany";
import { separateRelationOrderBy } from "./util/find/findUtil/separateRelationOrderBy";
import { findManyWithRelationOrderBy } from "./util/find/findManyWithRelationOrderBy";
import { findFirstWithRelationOrderBy } from "./util/find/findFirstWithRelationOrderBy";

class GassmaController {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private startRowNumber: number = 1;
  private startColumnNumber: number = 1;
  private endColumnNumber: number = 1;
  private relationContext: RelationContext | null = null;

  constructor(sheetName: string, id?: string) {
    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadSheet.getSheetByName(sheetName);

    if (!sheet)
      throw new Error(`Error: cant access sheet. sheetName: ${sheetName}`);

    this.sheet = sheet;

    this.endColumnNumber = this.sheet.getLastColumn();
  }

  public _setRelationContext(context: RelationContext) {
    this.relationContext = context;
  }

  public getColumnHeaders(): string[] {
    return getTitle(this.getGassmaControllerUtil());
  }

  public get fields(): Record<string, FieldRef> {
    const sheetName = this.sheet.getName();
    const titles = getTitle(this.getGassmaControllerUtil());
    const result: Record<string, FieldRef> = {};
    titles.forEach((title) => {
      result[title] = new FieldRef(sheetName, title);
    });
    return result;
  }

  public changeSettings(
    startRowNumber: number,
    startColumnValue: number | string,
    endColumnValue: number | string,
  ) {
    this.startRowNumber = startRowNumber;
    const { startColumnNumber, endColumnNumber } = changeSettingsFunc(
      startColumnValue,
      endColumnValue,
    );
    this.startColumnNumber = startColumnNumber;
    this.endColumnNumber = endColumnNumber;
  }

  private getGassmaControllerUtil(): GassmaControllerUtil {
    return {
      sheet: this.sheet,
      startRowNumber: this.startRowNumber,
      startColumnNumber: this.startColumnNumber,
      endColumnNumber: this.endColumnNumber,
    };
  }

  private resolveWhere(where: WhereUse | undefined): WhereUse | undefined {
    if (!where) return where;
    return resolveWhereRelation(where, this.relationContext);
  }

  private buildScalarSelect(select: Select): Select | null {
    const scalarKeys = Object.keys(select).filter((key) => key !== "_count");
    if (scalarKeys.length === 0) return null;
    const result: Select = {};
    scalarKeys.forEach((key) => {
      result[key] = select[key];
    });
    return result;
  }

  public createMany(createdData: CreateManyData) {
    return createManyFunc(this.getGassmaControllerUtil(), createdData);
  }

  public createManyAndReturn(createdData: CreateManyData) {
    return createManyFunc(this.getGassmaControllerUtil(), createdData, true);
  }

  public create(createdData: CreateData) {
    const util = this.getGassmaControllerUtil();
    const wrappedCreate = (data: Record<string, unknown>) =>
      createFunc(util, { data: data as AnyUse });
    return resolveNestedCreate(
      createdData.data,
      wrappedCreate,
      this.relationContext ?? undefined,
    );
  }

  public findFirst(findData: FindData) {
    if (findData.include && findData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (
      (findData.include || (findData.select && "_count" in findData.select)) &&
      !this.relationContext
    ) {
      throw new IncludeWithoutRelationsError();
    }

    findData = { ...findData, where: this.resolveWhere(findData.where) };

    const orderBy = "orderBy" in findData ? findData.orderBy : null;
    const orderByArr = orderBy
      ? Array.isArray(orderBy)
        ? orderBy
        : [orderBy]
      : [];
    const { hasRelationOrderBy } = separateRelationOrderBy(orderByArr);

    if (hasRelationOrderBy && this.relationContext) {
      const baseResult = findFirstWithRelationOrderBy(
        this.getGassmaControllerUtil(),
        {
          ...findData,
          select:
            findData.select && "_count" in findData.select
              ? undefined
              : findData.select,
        },
        this.relationContext,
        orderByArr,
      );

      if (!baseResult) return null;

      if (findData.select && "_count" in findData.select) {
        const countValue = findData.select._count;
        const scalarSelect = this.buildScalarSelect(findData.select);
        const resolved = applySelectCount(
          [baseResult],
          countValue,
          scalarSelect,
          this.relationContext,
        );
        return resolved[0] ?? null;
      }

      if (findData.include) {
        const resolved = resolveInclude(
          [baseResult],
          findData.include,
          this.relationContext,
        );
        return resolved[0] ?? null;
      }

      return baseResult;
    }

    if (
      findData.select &&
      "_count" in findData.select &&
      this.relationContext
    ) {
      const select = findData.select;
      const countValue = select._count;
      const scalarSelect = this.buildScalarSelect(select);

      const baseResult = findFirstFunc(this.getGassmaControllerUtil(), {
        ...findData,
        select: undefined,
      });

      if (!baseResult) return null;

      const resolved = applySelectCount(
        [baseResult],
        countValue,
        scalarSelect,
        this.relationContext,
      );
      return resolved[0] ?? null;
    }

    const baseResult = findFirstFunc(this.getGassmaControllerUtil(), findData);

    if (!baseResult || !findData.include || !this.relationContext) {
      return baseResult;
    }

    const resolved = resolveInclude(
      [baseResult],
      findData.include,
      this.relationContext,
    );
    return resolved[0] ?? null;
  }

  public findFirstOrThrow(findData: FindData) {
    const result = this.findFirst(findData);
    if (!result) {
      throw new NotFoundError();
    }
    return result;
  }

  public findMany(findData: FindData) {
    if (findData.include && findData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (
      (findData.include || (findData.select && "_count" in findData.select)) &&
      !this.relationContext
    ) {
      throw new IncludeWithoutRelationsError();
    }

    findData = { ...findData, where: this.resolveWhere(findData.where) };

    const fmOrderBy = "orderBy" in findData ? findData.orderBy : null;
    const fmOrderByArr = fmOrderBy
      ? Array.isArray(fmOrderBy)
        ? fmOrderBy
        : [fmOrderBy]
      : [];
    const { hasRelationOrderBy: fmHasRelation } =
      separateRelationOrderBy(fmOrderByArr);

    if (fmHasRelation && this.relationContext) {
      const baseResult = findManyWithRelationOrderBy(
        this.getGassmaControllerUtil(),
        {
          ...findData,
          select:
            findData.select && "_count" in findData.select
              ? undefined
              : findData.select,
        },
        this.relationContext,
        fmOrderByArr,
      );

      if (findData.select && "_count" in findData.select) {
        const countValue = findData.select._count;
        const scalarSelect = this.buildScalarSelect(findData.select);
        return applySelectCount(
          baseResult,
          countValue,
          scalarSelect,
          this.relationContext,
        );
      }

      if (findData.include) {
        return resolveInclude(
          baseResult,
          findData.include,
          this.relationContext,
        );
      }

      return baseResult;
    }

    if (
      findData.select &&
      "_count" in findData.select &&
      this.relationContext
    ) {
      const select = findData.select;
      const countValue = select._count;
      const scalarSelect = this.buildScalarSelect(select);

      const fullRecords = findManyFunc(this.getGassmaControllerUtil(), {
        ...findData,
        select: undefined,
      });

      return applySelectCount(
        fullRecords,
        countValue,
        scalarSelect,
        this.relationContext,
      );
    }

    const baseResult = findManyFunc(this.getGassmaControllerUtil(), findData);

    if (!findData.include || !this.relationContext) {
      return baseResult;
    }

    return resolveInclude(baseResult, findData.include, this.relationContext);
  }

  public update(updateData: {
    where: WhereUse;
    data: Record<string, unknown>;
  }) {
    const resolvedWhere =
      this.resolveWhere(updateData.where) ?? updateData.where;

    if (this.relationContext) {
      const beforeRecords = findManyFunc(this.getGassmaControllerUtil(), {
        where: resolvedWhere,
        take: 1,
      });
      if (beforeRecords.length > 0) {
        const predictedAfter = resolveNumberOperations(
          beforeRecords[0],
          updateData.data,
        );
        resolveOnUpdate(beforeRecords, [predictedAfter], this.relationContext);
      }
    }

    return resolveNestedUpdate(
      this.getGassmaControllerUtil(),
      { where: resolvedWhere, data: updateData.data },
      this.relationContext ?? undefined,
    );
  }

  public updateMany(updateData: UpdateData) {
    updateData = { ...updateData, where: this.resolveWhere(updateData.where) };

    if (this.relationContext) {
      const findData: FindData = { where: updateData.where };
      if (updateData.limit !== undefined && updateData.limit !== null) {
        findData.take = updateData.limit;
      }
      const beforeRecords = findManyFunc(
        this.getGassmaControllerUtil(),
        findData,
      );
      const predictedAfterRecords = beforeRecords.map((r) =>
        resolveNumberOperations(r, updateData.data),
      );
      resolveOnUpdate(
        beforeRecords,
        predictedAfterRecords,
        this.relationContext,
      );
    }

    return updateManyFunc(this.getGassmaControllerUtil(), updateData);
  }

  public updateManyAndReturn(updateData: UpdateData) {
    updateData = { ...updateData, where: this.resolveWhere(updateData.where) };

    if (this.relationContext) {
      const findData: FindData = { where: updateData.where };
      if (updateData.limit !== undefined && updateData.limit !== null) {
        findData.take = updateData.limit;
      }
      const beforeRecords = findManyFunc(
        this.getGassmaControllerUtil(),
        findData,
      );
      const predictedAfterRecords = beforeRecords.map((r) =>
        resolveNumberOperations(r, updateData.data),
      );
      resolveOnUpdate(
        beforeRecords,
        predictedAfterRecords,
        this.relationContext,
      );
    }

    return updateManyFunc(this.getGassmaControllerUtil(), updateData, true);
  }

  public upsert(upsertData: {
    where: WhereUse;
    create: AnyUse;
    update: AnyUse;
    select?: Select;
    include?: IncludeData;
    omit?: Omit;
  }) {
    if (upsertData.include && upsertData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (upsertData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }

    const resolvedWhere =
      this.resolveWhere(upsertData.where) ?? upsertData.where;

    return upsertFunc(
      this.getGassmaControllerUtil(),
      { ...upsertData, where: resolvedWhere },
      this.relationContext,
    );
  }

  public upsertMany(upsertData: UpsertData) {
    upsertData = { ...upsertData, where: this.resolveWhere(upsertData.where) };
    return upsertManyFunc(this.getGassmaControllerUtil(), upsertData);
  }

  public delete(deleteData: {
    where: WhereUse;
    select?: Select;
    include?: IncludeData;
    omit?: Omit;
  }) {
    if (deleteData.include && deleteData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (deleteData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }

    const resolvedWhere =
      this.resolveWhere(deleteData.where) ?? deleteData.where;

    return deleteFunc(
      this.getGassmaControllerUtil(),
      { ...deleteData, where: resolvedWhere },
      this.relationContext,
    );
  }

  public deleteMany(deleteData: DeleteData) {
    deleteData = { ...deleteData, where: this.resolveWhere(deleteData.where) };

    if (this.relationContext) {
      const findData: FindData = { where: deleteData.where };
      if (deleteData.limit !== undefined && deleteData.limit !== null) {
        findData.take = deleteData.limit;
      }
      const records = findManyFunc(this.getGassmaControllerUtil(), findData);
      resolveOnDelete(records, this.relationContext);
    }

    return deleteManyFunc(this.getGassmaControllerUtil(), deleteData);
  }

  public aggregate(aggregateData: AggregateData) {
    aggregateData = {
      ...aggregateData,
      where: this.resolveWhere(aggregateData.where),
    };
    return aggregateFunc(this.getGassmaControllerUtil(), aggregateData);
  }

  public count(countData: CountData) {
    countData = { ...countData, where: this.resolveWhere(countData.where) };
    return countFunc(this.getGassmaControllerUtil(), countData);
  }

  public groupBy(groupByData: GroupByData) {
    groupByData = {
      ...groupByData,
      where: this.resolveWhere(groupByData.where),
    };
    return groupByFunc(this.getGassmaControllerUtil(), groupByData);
  }
}

export { GassmaController };
