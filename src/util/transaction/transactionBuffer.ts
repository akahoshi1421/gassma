import { createBufferedSheetReader } from "../read/bufferedSheetReader";
import type { SheetReader } from "../read/sheetReader";
import {
  createBufferedSheetWriter,
  replaySheetOps,
} from "../write/bufferedSheetWriter";
import type { SheetOp } from "../write/bufferedSheetWriter";
import type { SheetWriter } from "../write/sheetWriter";
import { createVirtualSheetStore } from "./virtualSheetStore";

type TransactionBuffer = {
  writer: SheetWriter;
  reader: SheetReader;
  flush: () => void;
};

const createTransactionBuffer = (): TransactionBuffer => {
  const store = createVirtualSheetStore();
  const ops: SheetOp[] = [];
  return {
    writer: createBufferedSheetWriter(store, ops),
    reader: createBufferedSheetReader(store),
    flush: () => replaySheetOps(ops),
  };
};

export { createTransactionBuffer };
export type { TransactionBuffer };
