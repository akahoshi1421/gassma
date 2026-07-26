import { createBufferedSheetReader } from "../read/bufferedSheetReader";
import type { SheetReader } from "../read/sheetReader";
import {
  createBufferedSheetWriter,
  replaySheetOps,
} from "../write/bufferedSheetWriter";
import type { SheetOp } from "../write/bufferedSheetWriter";
import type { SheetWriter } from "../write/sheetWriter";
import { createVirtualSheetStore } from "./virtualSheetStore";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

type TransactionBuffer = {
  writer: SheetWriter;
  reader: SheetReader;
  flush: () => void;
  affectedSheets: () => Sheet[];
};

const createTransactionBuffer = (): TransactionBuffer => {
  const store = createVirtualSheetStore();
  const ops: SheetOp[] = [];
  return {
    writer: createBufferedSheetWriter(store, ops),
    reader: createBufferedSheetReader(store),
    flush: () => replaySheetOps(ops),
    affectedSheets: () => {
      const sheets: Sheet[] = [];
      ops.forEach((op) => {
        if (sheets.indexOf(op.sheet) === -1) sheets.push(op.sheet);
      });
      return sheets;
    },
  };
};

export { createTransactionBuffer };
export type { TransactionBuffer };
