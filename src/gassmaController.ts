import { CreateData } from "./types/createTypes";
import {
  DeleteData,
  FindData,
  UpdateData,
  UpsertData,
} from "./types/findTypes";

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

  private findedDataSelect(
    select: { [key: string]: true },
    row: { [key: string]: any }
  ) {
    const result = {};
    const selectKeys = Object.keys(select);

    selectKeys.forEach((key) => {
      result[key] = row[key];
    });

    return result;
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
    const data = createdData.data;
    const titles = this.getTitle();

    const wantCreateIndex = this.getWantUpdateIndex(createdData).sort();

    const newData = wantCreateIndex.map((index) => {
      return data[String(titles[index])];
    });

    const rowNumber = this.sheet.getLastRow() + 1;
    const columLength = this.endColumNumber - this.startColumNumber + 1;

    this.sheet
      .getRange(rowNumber, this.startColumNumber, 1, columLength)
      .setValues([newData]);
  }

  public findFirst(findData: FindData) {
    const where = findData.where;
    const select = "select" in findData ? findData.select : null;

    const wantFindIndex = this.getWantFindIndex(findData);

    const allDataList = this.allData();
    const titles = this.getTitle();

    const findedData = allDataList.find((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        return row[i] === where[String(titles[i])];
      });

      return matchRow.length === wantFindIndex.length;
    });

    if (!findedData) return null;

    const findedDataDict = {};

    findedData.forEach((data, dataIndex) => {
      findedDataDict[titles[dataIndex]] = data;
    });

    if (!select) return findedDataDict;

    return this.findedDataSelect(select, findedDataDict);
  }

  public findMany(findData: FindData) {
    const where = findData.where;
    const select = "select" in findData ? findData.select : null;

    const wantFindIndex = this.getWantFindIndex(findData);

    const allDataList = this.allData();
    const titles = this.getTitle();

    const findedDataIncludeNull = allDataList.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        return row[i] === where[String(titles[i])];
      });

      if (matchRow.length === wantFindIndex.length) return row;

      return null;
    });

    const findedData = findedDataIncludeNull.filter((data) => data !== null);

    const findDataDictArray = findedData.map((row) => {
      const result = {};
      row.forEach((data, dataIndex) => {
        result[titles[dataIndex]] = data;
      });

      return result;
    });

    if (!select) return findDataDictArray;

    const findDataDictArraySelected = findDataDictArray.map((row) => {
      return this.findedDataSelect(select, row);
    });

    return findDataDictArraySelected;
  }

  public updateMany(updateData: UpdateData) {
    const where = updateData.where;
    const data = updateData.data;

    const wantFindIndex = this.getWantFindIndex(updateData);
    const wantUpdateIndex = this.getWantUpdateIndex(updateData);

    const allDataList = this.allData();
    const titles = this.getTitle();

    allDataList.forEach((row, rowIndex) => {
      const matchRow = wantFindIndex.filter((i) => {
        return row[i] === where[String(titles[i])];
      });

      if (matchRow.length !== wantFindIndex.length) return;

      const updatedRow = row.map((updateData, updateDataIndex) => {
        if (!wantUpdateIndex.includes(updateDataIndex)) return updateData;

        return data[String(titles[updateDataIndex])];
      });

      if (updatedRow.length === 0) return;

      const rowNumber = rowIndex + 1 + this.startRowNumber;
      const columLength = this.endColumNumber - this.startColumNumber + 1;

      const updateRange = this.sheet.getRange(
        rowNumber,
        this.startColumNumber,
        1,
        columLength
      );

      updateRange.setValues([updatedRow]);
    });
  }

  public upsert(upsertData: UpsertData) {
    const findData = {
      where: upsertData.where,
    } as FindData;

    const findResult = this.findFirst(findData);

    if (!findResult) {
      const newData = {
        data: upsertData.create,
      } as CreateData;

      this.create(newData);
      return;
    }

    const updateData = {
      where: upsertData.where,
      data: upsertData.update,
    } as UpdateData;

    this.updateMany(updateData);
  }

  public deleteMany(deleteData: DeleteData) {
    const where = deleteData.where;

    const wantFindIndex = this.getWantFindIndex(deleteData);

    const allDataList = this.allData();
    const titles = this.getTitle();

    let deletedCnt = 0;

    allDataList.forEach((row, rowIndex) => {
      const matchRow = wantFindIndex.filter((i) => {
        return row[i] === where[String(titles[i])];
      });

      if (matchRow.length !== wantFindIndex.length) return;

      this.sheet.deleteRow(rowIndex + 1 + this.startRowNumber + deletedCnt);
      deletedCnt--;
    });
  }
}

export { GassmaController };
