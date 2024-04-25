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
    const columLength = this.endColumNumber - this.startColumNumber + 1;

    const tiltes = this.sheet
      .getRange(this.startRowNumber, this.startColumNumber, 1, columLength)
      .getValues()[0];

    return tiltes;
  }

  private getWantFindIndex(
    wantData: FindData | DeleteData | UpdateData
  ): number[] {
    const where = wantData.where;
    const titles = this.getTitle();

    const wantFindKeys = Object.entries(where).map((oneData) => {
      return oneData[0];
    });

    const wantFindIndex = wantFindKeys.map((key) => {
      return titles.findIndex((title) => {
        return title === key;
      });
    });

    return wantFindIndex;
  }

  private getWantUpdateIndex(wantData: CreateData | UpdateData) {
    const data = wantData.data;
    const titles = this.getTitle();

    const wantUpdateKeys = Object.entries(data).map((oneData) => {
      return oneData[0];
    });

    const wantUpdateIndex = wantUpdateKeys.map((key) => {
      return titles.findIndex((title) => {
        return title === key;
      });
    });

    return wantUpdateIndex;
  }

  private allData(): any[][] {
    const rowLength = this.sheet.getLastRow() - this.startRowNumber;
    const columLength = this.endColumNumber - this.startColumNumber + 1;

    const data = this.sheet
      .getRange(
        this.startRowNumber + 1,
        this.startColumNumber,
        rowLength,
        columLength
      )
      .getValues();

    return data;
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
