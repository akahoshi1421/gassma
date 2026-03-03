import { GassmaIncludeSelectConflictError } from "./errors/relation/relationError";
import { IncludeWithoutRelationsError } from "./errors/relation/relationValidationError";
import type { AggregateData } from "./types/aggregateType";
import type { AnyUse, WhereUse } from "./types/coreTypes";
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
import type { RelationContext } from "./types/relationTypes";
import { aggregateFunc } from "./util/aggregate/aggregate";
import { changeSettingsFunc } from "./util/changeSettings/changeSettings";
import { getTitle } from "./util/core/getTitle";
import { countFunc } from "./util/count/count";
import { createFunc } from "./util/create/create";
import { createManyFunc } from "./util/create/createManyFunc";
import { resolveNestedCreate } from "./util/create/nestedWrite/resolveNestedCreate";
import { deleteManyFunc } from "./util/delete/deleteMany";
import { findFirstFunc } from "./util/find/findFirst";
import { findManyFunc } from "./util/find/findMany";
import { groupByFunc } from "./util/groupby/groupby";
import { resolveOnDelete } from "./util/relation/onDelete/resolveOnDelete";
import { resolveOnUpdate } from "./util/relation/onUpdate/resolveOnUpdate";
import { resolveInclude } from "./util/relation/resolveInclude";
import { resolveWhereRelation } from "./util/relation/whereRelation/resolveWhereRelation";
import { resolveNestedUpdate } from "./util/update/nestedWrite/resolveNestedUpdate";
import { updateManyFunc } from "./util/update/updateMany";
import { upsertManyFunc } from "./util/upsert/upsertMany";

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
    if (findData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }

    findData = { ...findData, where: this.resolveWhere(findData.where) };
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

  public findMany(findData: FindData) {
    if (findData.include && findData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (findData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }

    findData = { ...findData, where: this.resolveWhere(findData.where) };
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
        const predictedAfter = { ...beforeRecords[0], ...updateData.data };
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
      const beforeRecords = findManyFunc(this.getGassmaControllerUtil(), {
        where: updateData.where,
      });
      const predictedAfterRecords = beforeRecords.map((r) => ({
        ...r,
        ...updateData.data,
      }));
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
      const beforeRecords = findManyFunc(this.getGassmaControllerUtil(), {
        where: updateData.where,
      });
      const predictedAfterRecords = beforeRecords.map((r) => ({
        ...r,
        ...updateData.data,
      }));
      resolveOnUpdate(
        beforeRecords,
        predictedAfterRecords,
        this.relationContext,
      );
    }

    return updateManyFunc(this.getGassmaControllerUtil(), updateData, true);
  }

  public upsertMany(upsertData: UpsertData) {
    upsertData = { ...upsertData, where: this.resolveWhere(upsertData.where) };
    return upsertManyFunc(this.getGassmaControllerUtil(), upsertData);
  }

  public deleteMany(deleteData: DeleteData) {
    deleteData = { ...deleteData, where: this.resolveWhere(deleteData.where) };

    if (this.relationContext) {
      const records = findManyFunc(this.getGassmaControllerUtil(), {
        where: deleteData.where,
      });
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
