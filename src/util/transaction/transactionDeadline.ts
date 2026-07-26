import { GassmaTransactionTimeoutError } from "../../errors/transaction/transactionError";

type TransactionPhase = "query" | "commit";

type DeadlineCheck = (phase: TransactionPhase) => void;

const createTransactionDeadline = (timeoutMs: number): DeadlineCheck => {
  const startedAt = Date.now();
  return (phase) => {
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs > timeoutMs) {
      throw new GassmaTransactionTimeoutError(phase, timeoutMs, elapsedMs);
    }
  };
};

export { createTransactionDeadline };
export type { DeadlineCheck, TransactionPhase };
