type SheetReader = {
  getLastRow(sheet: GoogleAppsScript.Spreadsheet.Sheet): number;
  getRangeValues(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rowNumber: number,
    columnNumber: number,
    rowLength: number,
    columnLength: number,
  ): any[][];
};

const immediateSheetReader: SheetReader = {
  getLastRow: (sheet) => sheet.getLastRow(),
  getRangeValues: (sheet, rowNumber, columnNumber, rowLength, columnLength) =>
    sheet
      .getRange(rowNumber, columnNumber, rowLength, columnLength)
      .getValues(),
};

const resolveReader = (reader: SheetReader | undefined): SheetReader =>
  reader ?? immediateSheetReader;

export { immediateSheetReader, resolveReader };
export type { SheetReader };
