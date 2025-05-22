import { GassmaController } from "./gassmaController";
import { GassmaSheet } from "./types/gassmaTypes";

class GassmaClient {
  public readonly sheets: GassmaSheet = {};

  constructor(id?: string) {
    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const mySheets = spreadSheet.getSheets();

    mySheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      const sheetController = new GassmaController(sheetName, id);

      this.sheets[sheetName] = sheetController;
    });
  }
}

export { GassmaClient };
