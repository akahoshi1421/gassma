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

type UpdateRowsOp = {
  kind: "updateRows";
  sheet: Sheet;
  startRowNumber: number;
  startColumnNumber: number;
  columnLength: number;
  rows: unknown[][];
};

type DeleteRowOp = {
  kind: "deleteRow";
  sheet: Sheet;
  rowNumber: number;
};

type DeleteRowsOp = {
  kind: "deleteRows";
  sheet: Sheet;
  rowPosition: number;
  howMany: number;
};

type SheetOp =
  | AppendRowsOp
  | UpdateRowOp
  | UpdateRowsOp
  | DeleteRowOp
  | DeleteRowsOp;

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
  updateRows: (
    sheet,
    startRowNumber,
    startColumnNumber,
    columnLength,
    rows,
  ) => {
    ops.push({
      kind: "updateRows",
      sheet,
      startRowNumber,
      startColumnNumber,
      columnLength,
      rows,
    });
    rows.forEach((row, index) => {
      store.updateRow(
        sheet,
        startRowNumber + index,
        startColumnNumber,
        columnLength,
        row,
      );
    });
  },
  deleteRow: (sheet, rowNumber) => {
    ops.push({ kind: "deleteRow", sheet, rowNumber });
    store.deleteRow(sheet, rowNumber);
  },
  deleteRows: (sheet, rowPosition, howMany) => {
    ops.push({ kind: "deleteRows", sheet, rowPosition, howMany });
    store.deleteRows(sheet, rowPosition, howMany);
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
  if (op.kind === "updateRows") {
    immediateSheetWriter.updateRows(
      op.sheet,
      op.startRowNumber,
      op.startColumnNumber,
      op.columnLength,
      op.rows,
    );
    return;
  }
  if (op.kind === "deleteRows") {
    immediateSheetWriter.deleteRows(op.sheet, op.rowPosition, op.howMany);
    return;
  }
  immediateSheetWriter.deleteRow(op.sheet, op.rowNumber);
};

const replaySheetOps = (ops: SheetOp[]) => {
  ops.forEach(replaySheetOp);
};

export { createBufferedSheetWriter, replaySheetOps };
export type { SheetOp };
