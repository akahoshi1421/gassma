import { DeleteData, FindData, UpdateData } from "./types/findTypes";

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

  public allData(): any[][] {
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

  public findData(findData: FindData) {
    const where = findData.where;
    const allDataList = this.allData();
    const titles = this.getTitle();

    const wantFindKeys = Object.entries(where).map((oneData) => {
      return oneData[0];
    });

    const wantFindIndex = wantFindKeys.map((key) => {
      return titles.findIndex((title) => {
        return title === key;
      });
    });

    const findedDataIncludeNull = allDataList.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        return row[i] === where[String(titles[i])];
      });

      if (matchRow.length === wantFindIndex.length) return row;

      return null;
    });

    return findedDataIncludeNull.filter((data) => data !== null);
  }

  public updateData(updateData: UpdateData) {}

  public deleteData(deleteData: DeleteData) {
    const where = deleteData.where;
    const allDataList = this.allData();
    const titles = this.getTitle();

    const wantFindKeys = Object.entries(where).map((oneData) => {
      return oneData[0];
    });

    const wantFindIndex = wantFindKeys.map((key) => {
      return titles.findIndex((title) => {
        return title === key;
      });
    });

    allDataList.forEach((row, rowIndex) => {
      const matchRow = wantFindIndex.filter((i) => {
        return row[i] === where[String(titles[i])];
      });

      if (matchRow.length !== wantFindIndex.length) return;

      this.sheet.deleteRow(rowIndex + 1 + this.startRowNumber);
    });
  }
}

export { GassmaController };
