import { GassmaController } from "./gassmaController";
import { GassmaSheet } from "./types/gassmaTypes";

class GassmaClient {
  public readonly sheets: GassmaSheet = {};

  constructor() {
    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const mySheets = spreadSheet.getSheets();

    mySheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      const sheetController = new GassmaController(sheetName);

      this.sheets[sheetName] = sheetController;
    });
  }
}

export { GassmaClient };
