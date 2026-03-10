import { applyDefaults } from "./util/defaults/applyDefaults";
import { applyUpdatedAt } from "./util/defaults/applyUpdatedAt";
import type { DefaultsForSheet } from "./util/defaults/applyDefaults";
import { FieldRef } from "./util/filterConditions/fieldRef";
import {
  GassmaFindSelectOmitConflictError,
  NotFoundError,
} from "./errors/find/findError";
import { findedDataSelect } from "./util/find/findUtil/findDataSelect";
import { omitFunc } from "./util/find/findUtil/omit";
import { resolveGlobalOmit } from "./util/omit/resolveGlobalOmit";
import { GassmaIncludeSelectConflictError } from "./errors/relation/relationError";
import { IncludeWithoutRelationsError } from "./errors/relation/relationValidationError";
import type { AggregateData } from "./types/aggregateType";
import type { AnyUse, Select, Omit, WhereUse } from "./types/coreTypes";
import type { CountData } from "./types/countType";
import type { CreateData, CreateManyData } from "./types/createTypes";
import type {
  DeleteData,
  DeleteSingleData,
  FindData,
  UpdateData,
  UpdateSingleData,
  UpsertData,
  UpsertSingleData,
} from "./types/findTypes";
import type { GassmaControllerUtil } from "./types/gassmaControllerUtilType";
import type { GroupByData } from "./types/groupByType";
import type { RelationContext } from "./types/relationTypes";
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
  private globalOmit: Omit | null = null;
  private defaults: DefaultsForSheet | null = null;
  private updatedAtField: string | null = null;

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

  public _setGlobalOmit(omit: Omit) {
    this.globalOmit = omit;
  }

  public _setDefaults(defaults: DefaultsForSheet) {
    this.defaults = defaults;
  }

  public _setUpdatedAt(field: string) {
    this.updatedAtField = field;
  }

  private applyUpdatedAtToData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!this.updatedAtField) return data;
    return applyUpdatedAt(data, this.updatedAtField);
  }

  private applyDefaultsToData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!this.defaults) return data;
    return applyDefaults(data, this.defaults);
  }

  public get fields(): Record<string, FieldRef> {
    const sheetName = this.sheet.getName();
    return new Proxy({} as Record<string, FieldRef>, {
      get: (_target, prop: string) => {
        if (typeof prop !== "string") return undefined;
        return new FieldRef(sheetName, prop);
      },
    });
  }

  public getColumnHeaders(): string[] {
    return getTitle(this.getGassmaControllerUtil());
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

  private resolveEffectiveOmit(
    select: Select | null | undefined,
    queryOmit: Omit | null | undefined,
  ): Omit | null {
    return resolveGlobalOmit(this.globalOmit, select, queryOmit);
  }

  private applyOmitToResult(
    result: Record<string, unknown>,
    effectiveOmit: Omit | null,
  ): Record<string, unknown> {
    if (!effectiveOmit) return result;
    return omitFunc(effectiveOmit, result);
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

  private applyDefaultsToManyData(createdData: CreateManyData): CreateManyData {
    if (!this.defaults && !this.updatedAtField) return createdData;
    const defs = this.defaults;
    const field = this.updatedAtField;
    return {
      ...createdData,
      data: createdData.data.map((d) => {
        let result = defs ? applyDefaults(d, defs) : { ...d };
        if (field) result = applyUpdatedAt(result, field);
        return result as AnyUse;
      }),
    };
  }

  public createMany(createdData: CreateManyData) {
    return createManyFunc(
      this.getGassmaControllerUtil(),
      this.applyDefaultsToManyData(createdData),
    );
  }

  public createManyAndReturn(createdData: CreateManyData) {
    const results = createManyFunc(
      this.getGassmaControllerUtil(),
      this.applyDefaultsToManyData(createdData),
      true,
    );
    if (!this.globalOmit || !Array.isArray(results)) return results;
    return results.map((r) => this.applyOmitToResult(r, this.globalOmit));
  }

  public create(createdData: CreateData) {
    if (createdData.select && createdData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const util = this.getGassmaControllerUtil();
    const dataWithDefaults = this.applyUpdatedAtToData(
      this.applyDefaultsToData(createdData.data),
    );
    const wrappedCreate = (data: Record<string, unknown>) =>
      createFunc(util, { data: data as AnyUse });
    const result = resolveNestedCreate(
      dataWithDefaults,
      wrappedCreate,
      this.relationContext ?? undefined,
    );

    if (createdData.select) return findedDataSelect(createdData.select, result);
    const effectiveOmit = this.resolveEffectiveOmit(null, createdData.omit);
    return this.applyOmitToResult(result, effectiveOmit);
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

    if (findData.select && findData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const effectiveOmit = this.resolveEffectiveOmit(
      findData.select,
      findData.omit,
    );
    findData = {
      ...findData,
      where: this.resolveWhere(findData.where),
      omit: effectiveOmit ?? undefined,
    };

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

    if (findData.select && findData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const fmEffectiveOmit = this.resolveEffectiveOmit(
      findData.select,
      findData.omit,
    );
    findData = {
      ...findData,
      where: this.resolveWhere(findData.where),
      omit: fmEffectiveOmit ?? undefined,
    };

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

  public update(updateData: UpdateSingleData) {
    if (updateData.select && updateData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

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

    const updateDataWithTimestamp = this.applyUpdatedAtToData(updateData.data);

    const result = resolveNestedUpdate(
      this.getGassmaControllerUtil(),
      { where: resolvedWhere, data: updateDataWithTimestamp },
      this.relationContext ?? undefined,
    );
    if (!result) return null;

    if (updateData.select) return findedDataSelect(updateData.select, result);
    const effectiveOmit = this.resolveEffectiveOmit(null, updateData.omit);
    return this.applyOmitToResult(result, effectiveOmit);
  }

  public updateMany(updateData: UpdateData) {
    updateData = {
      ...updateData,
      where: this.resolveWhere(updateData.where),
      data: this.applyUpdatedAtToData(updateData.data),
    };

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
    updateData = {
      ...updateData,
      where: this.resolveWhere(updateData.where),
      data: this.applyUpdatedAtToData(updateData.data),
    };

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

    const results = updateManyFunc(
      this.getGassmaControllerUtil(),
      updateData,
      true,
    );
    if (!this.globalOmit || !Array.isArray(results)) return results;
    return results.map((r) => this.applyOmitToResult(r, this.globalOmit));
  }

  public upsert(upsertData: UpsertSingleData) {
    if (upsertData.include && upsertData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (upsertData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }

    const resolvedWhere =
      this.resolveWhere(upsertData.where) ?? upsertData.where;
    const upsertOmit = this.resolveEffectiveOmit(
      upsertData.select,
      upsertData.omit,
    );

    const createWithDefaults = this.applyUpdatedAtToData(
      this.applyDefaultsToData(upsertData.create),
    );
    const updateWithTimestamp = this.applyUpdatedAtToData(upsertData.update);

    return upsertFunc(
      this.getGassmaControllerUtil(),
      {
        ...upsertData,
        where: resolvedWhere,
        create: createWithDefaults as AnyUse,
        update: updateWithTimestamp as AnyUse,
        omit: upsertOmit ?? undefined,
      },
      this.relationContext,
    );
  }

  public upsertMany(upsertData: UpsertData) {
    upsertData = { ...upsertData, where: this.resolveWhere(upsertData.where) };
    return upsertManyFunc(this.getGassmaControllerUtil(), upsertData);
  }

  public delete(deleteData: DeleteSingleData) {
    if (deleteData.include && deleteData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (deleteData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }

    const resolvedWhere =
      this.resolveWhere(deleteData.where) ?? deleteData.where;
    const deleteOmit = this.resolveEffectiveOmit(
      deleteData.select,
      deleteData.omit,
    );

    return deleteFunc(
      this.getGassmaControllerUtil(),
      {
        ...deleteData,
        where: resolvedWhere,
        omit: deleteOmit ?? undefined,
      },
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
