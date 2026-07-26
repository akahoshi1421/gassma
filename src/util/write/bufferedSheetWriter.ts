import type { VirtualSheetStore } from "../transaction/virtualSheetStore";
import type { SheetWriter } from "./sheetWriter";
import { immediateSheetWriter } from "./sheetWriter";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

type AppendRowsOp = {
  kind: "appendRows";
  sheet: Sheet;
  startColumnNumber: number;
  columnLength: number;
  rows: unknown[][];
};

type UpdateRowOp = {
  kind: "updateRow";
  sheet: Sheet;
  rowNumber: number;
  startColumnNumber: number;
  columnLength: number;
  row: unknown[];
};

type DeleteRowOp = {
  kind: "deleteRow";
  sheet: Sheet;
  rowNumber: number;
};

type SheetOp = AppendRowsOp | UpdateRowOp | DeleteRowOp;

const createBufferedSheetWriter = (
  store: VirtualSheetStore,
  ops: SheetOp[],
): SheetWriter => ({
  appendRows: (sheet, startColumnNumber, columnLength, rows) => {
    ops.push({
      kind: "appendRows",
      sheet,
      startColumnNumber,
      columnLength,
      rows,
    });
    store.appendRows(sheet, startColumnNumber, columnLength, rows);
  },
  updateRow: (sheet, rowNumber, startColumnNumber, columnLength, row) => {
    ops.push({
      kind: "updateRow",
      sheet,
      rowNumber,
      startColumnNumber,
      columnLength,
      row,
    });
    store.updateRow(sheet, rowNumber, startColumnNumber, columnLength, row);
  },
  deleteRow: (sheet, rowNumber) => {
    ops.push({ kind: "deleteRow", sheet, rowNumber });
    store.deleteRow(sheet, rowNumber);
  },
});

const replaySheetOp = (op: SheetOp) => {
  if (op.kind === "appendRows") {
    immediateSheetWriter.appendRows(
      op.sheet,
      op.startColumnNumber,
      op.columnLength,
      op.rows,
    );
    return;
  }
  if (op.kind === "updateRow") {
    immediateSheetWriter.updateRow(
      op.sheet,
      op.rowNumber,
      op.startColumnNumber,
      op.columnLength,
      op.row,
    );
    return;
  }
  immediateSheetWriter.deleteRow(op.sheet, op.rowNumber);
};

const replaySheetOps = (ops: SheetOp[]) => {
  ops.forEach(replaySheetOp);
};

export { createBufferedSheetWriter, replaySheetOps };
export type { SheetOp };
