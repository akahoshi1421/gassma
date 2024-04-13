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

  public findRow(findData: FindData) {}

  public findRows(findData: FindData) {}

  public updateRow(updateData: UpdateData) {}

  public updateRows(updateDate: UpdateData) {}

  public deleteRow(deleteData: DeleteData) {}

  public deleteRows(deleteData: DeleteData) {}
}

export { GassmaController };
