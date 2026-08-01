import { isDateValue } from "../other/isDateValue";
import type { SheetWriter } from "../write/sheetWriter";
import type { SheetReader } from "./sheetReader";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

type SheetCacheEntry = {
  lastRow: number | null;
  ranges: Map<string, any[][]>;
};

const cloneCell = (cell: any): any =>
  isDateValue(cell) ? new Date(cell.getTime()) : cell;

const copyValues = (values: any[][]): any[][] =>
  values.map((row) => row.map(cloneCell));

const createSheetReadCache = () => {
  const entries = new Map<Sheet, SheetCacheEntry>();

  const entryFor = (sheet: Sheet): SheetCacheEntry => {
    const existing = entries.get(sheet);
    if (existing) return existing;
    const created: SheetCacheEntry = { lastRow: null, ranges: new Map() };
    entries.set(sheet, created);
    return created;
  };

  const clear = () => {
    entries.clear();
  };

  const wrapReader = (base: SheetReader): SheetReader => ({
    getLastRow: (sheet) => {
      const entry = entryFor(sheet);
      if (entry.lastRow === null) entry.lastRow = base.getLastRow(sheet);
      return entry.lastRow;
    },
    getRangeValues: (
      sheet,
      rowNumber,
      columnNumber,
      rowLength,
      columnLength,
    ) => {
      const entry = entryFor(sheet);
      const key = `${rowNumber},${columnNumber},${rowLength},${columnLength}`;
      const cached = entry.ranges.get(key);
      if (cached) return copyValues(cached);
      const values = base.getRangeValues(
        sheet,
        rowNumber,
        columnNumber,
        rowLength,
        columnLength,
      );
      entry.ranges.set(key, copyValues(values));
      return values;
    },
  });

  const wrapWriter = (base: SheetWriter): SheetWriter => ({
    appendRows: (sheet, startColumnNumber, columnLength, rows) => {
      clear();
      base.appendRows(sheet, startColumnNumber, columnLength, rows);
    },
    updateRow: (sheet, rowNumber, startColumnNumber, columnLength, row) => {
      clear();
      base.updateRow(sheet, rowNumber, startColumnNumber, columnLength, row);
    },
    updateRows: (
      sheet,
      startRowNumber,
      startColumnNumber,
      columnLength,
      rows,
    ) => {
      clear();
      base.updateRows(
        sheet,
        startRowNumber,
        startColumnNumber,
        columnLength,
        rows,
      );
    },
    deleteRow: (sheet, rowNumber) => {
      clear();
      base.deleteRow(sheet, rowNumber);
    },
    deleteRows: (sheet, rowPosition, howMany) => {
      clear();
      base.deleteRows(sheet, rowPosition, howMany);
    },
  });

  return { wrapReader, wrapWriter, clear };
};

type SheetReadCache = ReturnType<typeof createSheetReadCache>;

export { createSheetReadCache };
export type { SheetReadCache };
