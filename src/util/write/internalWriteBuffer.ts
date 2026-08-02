import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { TransactionBuffer } from "../transaction/transactionBuffer";
import { createTransactionBuffer } from "../transaction/transactionBuffer";
import { immediateSheetWriter, resolveWriter } from "./sheetWriter";

let activeBuffer: TransactionBuffer | null = null;

const openInternalWriteBuffer = (): void => {
  activeBuffer = createTransactionBuffer();
};

const flushInternalWriteBuffer = (): void => {
  activeBuffer?.flush();
};

const closeInternalWriteBuffer = (): void => {
  activeBuffer = null;
};

const applyInternalWriteBuffer = (
  util: GassmaControllerUtil,
): GassmaControllerUtil => {
  if (!activeBuffer) return util;
  if (resolveWriter(util.writer) !== immediateSheetWriter) return util;
  return {
    ...util,
    reader: activeBuffer.reader,
    writer: activeBuffer.writer,
  };
};

export {
  applyInternalWriteBuffer,
  closeInternalWriteBuffer,
  flushInternalWriteBuffer,
  openInternalWriteBuffer,
};
