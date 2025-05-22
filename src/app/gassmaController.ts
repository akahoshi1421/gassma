import { AggregateData } from "./types/aggregateType";
import { ChangeSettingsData } from "./types/changeSettingsType";
import { CountData } from "./types/countType";
import { CreateData, CreateManyData } from "./types/createTypes";
import {
  DeleteData,
  FindData,
  UpdateData,
  UpsertData,
} from "./types/findTypes";
import { GassmaControllerUtil } from "./types/gassmaControllerUtilType";
import { GroupByData } from "./types/groupByType";
import { aggregateFunc } from "./util/aggregate/aggregate";
import { changeSettingsFunc } from "./util/changeSettings/changeSettings";
import { countFunc } from "./util/count/count";
import { createFunc } from "./util/create/create";
import { createManyFunc } from "./util/create/createManyFunc";
import { deleteManyFunc } from "./util/delete/deleteMany";
import { findFirstFunc } from "./util/find/findFirst";
import { findManyFunc } from "./util/find/findMany";
import { groupByFunc } from "./util/groupby/groupby";
import { updateManyFunc } from "./util/update/updateMany";
import { upsertManyFunc } from "./util/upsert/upsertMany";
import { SchemaType } from "./types/core/schemaType";

class GassmaController {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private startRowNumber: number = 1;
  private startColumnNumber: number = 1;
  private endColumnNumber: number = 1;
  private schema: SchemaType = undefined;

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

  public changeSettings(ChangeSettingsData: ChangeSettingsData) {
    const { startRowNumber, startColumnValue, endColumnValue, schema } =
      ChangeSettingsData;

    if (schema !== undefined) this.schema = schema;
    if (startRowNumber !== undefined) this.startRowNumber = startRowNumber;
    const { startColumnNumber, endColumnNumber } = changeSettingsFunc(
      startColumnValue,
      endColumnValue
    );
    if (startColumnNumber !== undefined)
      this.startColumnNumber = startColumnNumber;
    if (endColumnNumber !== undefined) this.endColumnNumber = endColumnNumber;
  }

  private getGassmaControllerUtil(): GassmaControllerUtil {
    return {
      sheet: this.sheet,
      startRowNumber: this.startRowNumber,
      startColumnNumber: this.startColumnNumber,
      endColumnNumber: this.endColumnNumber,
      schema: this.schema,
    };
  }

  public createMany(createdData: CreateManyData) {
    return createManyFunc(this.getGassmaControllerUtil(), createdData);
  }

  public create(createdData: CreateData) {
    return createFunc(this.getGassmaControllerUtil(), createdData);
  }

  public findFirst(findData: FindData) {
    return findFirstFunc(this.getGassmaControllerUtil(), findData);
  }

  public findMany(findData: FindData) {
    return findManyFunc(this.getGassmaControllerUtil(), findData);
  }

  public updateMany(updateData: UpdateData) {
    return updateManyFunc(this.getGassmaControllerUtil(), updateData);
  }

  public upsertMany(upsertData: UpsertData) {
    return upsertManyFunc(this.getGassmaControllerUtil(), upsertData);
  }

  public deleteMany(deleteData: DeleteData) {
    return deleteManyFunc(this.getGassmaControllerUtil(), deleteData);
  }

  public aggregate(aggregateData: AggregateData) {
    return aggregateFunc(this.getGassmaControllerUtil(), aggregateData);
  }

  public count(countData: CountData) {
    return countFunc(this.getGassmaControllerUtil(), countData);
  }

  public groupBy(groupByData: GroupByData) {
    return groupByFunc(this.getGassmaControllerUtil(), groupByData);
  }
}

export { GassmaController };
