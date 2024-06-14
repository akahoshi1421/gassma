import { AggregateData } from "./types/aggregateType";
import { CountData } from "./types/countType";
import { CreateData, CreateManyData } from "./types/createTypes";
import {
  DeleteData,
  FindData,
  UpdateData,
  UpsertData,
} from "./types/findTypes";
import { GassmaControllerUtil } from "./types/gassmaControllerUtilType";
import { aggregateFunc } from "./util/aggregate/aggregate";
import { changeSettingsFunc } from "./util/changeSettings/changeSettings";
import { countFunc } from "./util/count/count";
import { createFunc } from "./util/create/create";
import { createManyFunc } from "./util/create/createManyFunc";
import { deleteManyFunc } from "./util/delete/deleteMany";
import { findFirstFunc } from "./util/find/findFirst";
import { findManyFunc } from "./util/find/findMany";
import { updateManyFunc } from "./util/update/updateMany";
import { upsertFunc } from "./util/upsert/upsert";

class GassmaController {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private startRowNumber: number = 1;
  private startColumNumber: number = 1;
  private endColumNumber: number = 1;

  constructor(sheetName: string, id?: string) {
    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadSheet.getSheetByName(sheetName);

    if (!sheet)
      throw new Error(`Error: cant access sheet. sheetName: ${sheetName}`);

    this.sheet = sheet;

    this.endColumNumber = this.sheet.getLastColumn();
  }

  public changeSettings(
    startRowNumber: number,
    startColumValue: number | string,
    endColumValue: number | string
  ) {
    this.startRowNumber = startRowNumber;
    const { startColumNumber, endColumNumber } = changeSettingsFunc(
      startColumValue,
      endColumValue
    );
    this.startColumNumber = startColumNumber;
    this.endColumNumber = endColumNumber;
  }

  private getGassmaControllerUtil(): GassmaControllerUtil {
    return {
      sheet: this.sheet,
      startRowNumber: this.startRowNumber,
      startColumNumber: this.startColumNumber,
      endColumNumber: this.endColumNumber,
    };
  }

  public createMany(createdData: CreateManyData) {
    createManyFunc(this.getGassmaControllerUtil(), createdData);
  }

  public create(createdData: CreateData) {
    createFunc(this.getGassmaControllerUtil(), createdData);
  }

  public findFirst(findData: FindData) {
    return findFirstFunc(this.getGassmaControllerUtil(), findData);
  }

  public findMany(findData: FindData) {
    return findManyFunc(this.getGassmaControllerUtil(), findData);
  }

  public updateMany(updateData: UpdateData) {
    updateManyFunc(this.getGassmaControllerUtil(), updateData);
  }

  public upsert(upsertData: UpsertData) {
    upsertFunc(this.getGassmaControllerUtil(), upsertData);
  }

  public deleteMany(deleteData: DeleteData) {
    deleteManyFunc(this.getGassmaControllerUtil(), deleteData);
  }

  public aggregate(aggregateData: AggregateData) {
    return aggregateFunc(this.getGassmaControllerUtil(), aggregateData);
  }

  public count(countData: CountData) {
    return countFunc(this.getGassmaControllerUtil(), countData);
  }
}

export { GassmaController };
