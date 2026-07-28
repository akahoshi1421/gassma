type SheetWriter = {
  appendRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startColumnNumber: number,
    columnLength: number,
    rows: unknown[][],
  ): void;
  updateRow(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rowNumber: number,
    startColumnNumber: number,
    columnLength: number,
    row: unknown[],
  ): void;
  updateRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    startRowNumber: number,
    startColumnNumber: number,
    columnLength: number,
    rows: unknown[][],
  ): void;
  deleteRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, rowNumber: number): void;
  deleteRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rowPosition: number,
    howMany: number,
  ): void;
};

const immediateSheetWriter: SheetWriter = {
  appendRows: (sheet, startColumnNumber, columnLength, rows) => {
    const rowNumber = sheet.getLastRow() + 1;
    sheet
      .getRange(rowNumber, startColumnNumber, rows.length, columnLength)
      .setValues(rows);
  },
  updateRow: (sheet, rowNumber, startColumnNumber, columnLength, row) => {
    sheet
      .getRange(rowNumber, startColumnNumber, 1, columnLength)
      .setValues([row]);
  },
  updateRows: (
    sheet,
    startRowNumber,
    startColumnNumber,
    columnLength,
    rows,
  ) => {
    sheet
      .getRange(startRowNumber, startColumnNumber, rows.length, columnLength)
      .setValues(rows);
  },
  deleteRow: (sheet, rowNumber) => {
    sheet.deleteRow(rowNumber);
  },
  deleteRows: (sheet, rowPosition, howMany) => {
    sheet.deleteRows(rowPosition, howMany);
  },
};

const resolveWriter = (writer: SheetWriter | undefined): SheetWriter =>
  writer ?? immediateSheetWriter;

export { immediateSheetWriter, resolveWriter };
export type { SheetWriter };
