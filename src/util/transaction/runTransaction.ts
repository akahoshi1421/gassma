import {
  GassmaNestedTransactionError,
  GassmaTransactionLockRequiredError,
  GassmaTransactionLockTimeoutError,
} from "../../errors/transaction/transactionError";
import type { Lock } from "../../types/relationTypes";
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

const acquireLock = (lock: Lock, maxWaitMs: number): boolean => {
  if (lock.hasLock()) return false;
  try {
    lock.waitLock(maxWaitMs);
  } catch {
    throw new GassmaTransactionLockTimeoutError(maxWaitMs);
  }
  return true;
};

const runTransaction = <T>(
  fn: (tx: GassmaTransactionClient) => T,
  options: GassmaTransactionOptions | undefined,
  buildBufferedClient: (sheetIo: SheetIo) => object,
  lock: Lock | undefined,
): T => {
  if (transactionInProgress) {
    throw new GassmaNestedTransactionError();
  }
  if (!lock) {
    throw new GassmaTransactionLockRequiredError();
  }
  const maxWaitMs = options?.maxWait ?? DEFAULT_MAX_WAIT_MS;
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const rollback = options?.rollback ?? true;
  const acquired = acquireLock(lock, maxWaitMs);
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
    if (acquired) lock.releaseLock();
  }
};

export { runTransaction };
