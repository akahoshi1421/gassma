import {
  GassmaNestedTransactionError,
  GassmaTransactionLockTimeoutError,
} from "../../errors/transaction/transactionError";
import type {
  GassmaTransactionClient,
  GassmaTransactionOptions,
  SheetIo,
} from "../../types/transactionTypes";
import { buildTransactionClient } from "./buildTransactionClient";
import {
  flushWithBackup,
  warnStaleTransactionBackups,
} from "./transactionBackup";
import { createTransactionBuffer } from "./transactionBuffer";
import { createTransactionDeadline } from "./transactionDeadline";

const DEFAULT_MAX_WAIT_MS = 20000;
const DEFAULT_TIMEOUT_MS = 60000;

let transactionInProgress = false;

const acquireScriptLock = (maxWaitMs: number): GoogleAppsScript.Lock.Lock => {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(maxWaitMs);
  } catch {
    throw new GassmaTransactionLockTimeoutError(maxWaitMs);
  }
  return lock;
};

const runTransaction = <T>(
  fn: (tx: GassmaTransactionClient) => T,
  options: GassmaTransactionOptions | undefined,
  buildBufferedClient: (sheetIo: SheetIo) => object,
): T => {
  if (transactionInProgress) {
    throw new GassmaNestedTransactionError();
  }
  const maxWaitMs = options?.maxWait ?? DEFAULT_MAX_WAIT_MS;
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const rollback = options?.rollback ?? true;
  const lock = acquireScriptLock(maxWaitMs);
  transactionInProgress = true;
  try {
    warnStaleTransactionBackups();
    const checkDeadline = createTransactionDeadline(timeoutMs);
    const buffer = createTransactionBuffer();
    const baseClient = buildBufferedClient({
      writer: buffer.writer,
      reader: buffer.reader,
    });
    const tx = buildTransactionClient(baseClient, () => checkDeadline("query"));
    const result = fn(tx);
    checkDeadline("commit");
    if (rollback) {
      flushWithBackup(buffer);
    } else {
      buffer.flush();
    }
    return result;
  } finally {
    transactionInProgress = false;
    lock.releaseLock();
  }
};

export { runTransaction };
