import { CreateData } from "./types/createTypes";
import {
  DeleteData,
  FindData,
  UpdateData,
  UpsertData,
} from "./types/findTypes";
import { GassmaControllerUtil } from "./types/gassmaControllerUtilType";
import { createFunc } from "./util/create/create";
import { deleteManyFunc } from "./util/delete/deleteMany";
import { findFirstFunc } from "./util/find/findFirst";
import { findManyFunc } from "./util/find/findMany";
import { getAllDataFunc } from "./util/private/allData";
import { getTitleFunc } from "./util/private/getTitle";
import { getWantFindIndexFunc } from "./util/private/getWantFindIndex";
import { getWantUpdateIndexFunc } from "./util/private/getWantUpdateIndex";
import { updateManyFunc } from "./util/update/updateMany";
import { upsertFunc } from "./util/upsert/upsert";

class GassmaController {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private startRowNumber: number = 1;
  private startColumNumber: number = 1;
  private endColumNumber: number = 1;

  constructor(sheetName: string) {
    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadSheet.getSheetByName(sheetName);

    if (!sheet)
      throw new Error(`Error: cant access sheet. sheetName: ${sheetName}`);

    this.sheet = sheet;

    this.endColumNumber = this.sheet.getLastColumn();
  }

  public changeSettings(
    startRowNumber: number,
    startColumNumber: number,
    endColumNumber: number
  ) {
    this.startRowNumber = startRowNumber;
    this.startColumNumber = startColumNumber;
    this.endColumNumber = endColumNumber;
  }

  private getGassmaControllerUtil(): GassmaControllerUtil {
    return {
      sheet: this.sheet,
      startRowNumber: this.startRowNumber,
      startColumNumber: this.startRowNumber,
      endColumNumber: this.endColumNumber,
      getTitle: this.getTitle.bind(this),
      getWantFindIndex: this.getWantFindIndex.bind(this),
      getWantUpdateIndex: this.getWantUpdateIndex.bind(this),
      allData: this.allData.bind(this),
    };
  }

  private getTitle(): any[] {
    return getTitleFunc(this.getGassmaControllerUtil());
  }

  private getWantFindIndex(
    wantData: FindData | DeleteData | UpdateData
  ): number[] {
    return getWantFindIndexFunc(this.getGassmaControllerUtil(), wantData);
  }

  private getWantUpdateIndex(wantData: CreateData | UpdateData): number[] {
    return getWantUpdateIndexFunc(this.getGassmaControllerUtil(), wantData);
  }

  private allData(): any[][] {
    return getAllDataFunc(this.getGassmaControllerUtil());
  }

  public createMany(createdData: CreateData[]) {
    createdData.forEach((data) => this.create(data));
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
}

export { GassmaController };
