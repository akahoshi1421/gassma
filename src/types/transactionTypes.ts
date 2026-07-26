import type { SheetReader } from "../util/read/sheetReader";
import type { SheetWriter } from "../util/write/sheetWriter";
import type { ExtendedGassmaClient, GassmaExtension } from "./extendsTypes";
import type { GassmaSheet } from "./gassmaTypes";

type SheetIo = {
  writer: SheetWriter;
  reader: SheetReader;
};

type GassmaTransactionOptions = {
  maxWait?: number;
  timeout?: number;
};

type TransactionClientCore = {
  $extends: (extension: GassmaExtension) => ExtendedGassmaClient;
};

type GassmaTransactionClient = TransactionClientCore & GassmaSheet;

export type {
  GassmaTransactionClient,
  GassmaTransactionOptions,
  SheetIo,
  TransactionClientCore,
};
