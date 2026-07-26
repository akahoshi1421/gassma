class GassmaTransactionLockTimeoutError extends Error {
  constructor(maxWaitMs: number) {
    super(
      `Transaction API error: Unable to start a transaction in the given time. The maxWait for this transaction was ${maxWaitMs} ms.`,
    );
    this.name = "GassmaTransactionLockTimeoutError";
  }
}

class GassmaTransactionTimeoutError extends Error {
  constructor(phase: "query" | "commit", timeoutMs: number, elapsedMs: number) {
    super(
      `Transaction API error: A ${phase} cannot be executed on an expired transaction. The timeout for this transaction was ${timeoutMs} ms, however ${elapsedMs} ms passed since the start of the transaction. Consider increasing the transaction timeout or doing less work in the transaction.`,
    );
    this.name = "GassmaTransactionTimeoutError";
  }
}

class GassmaNestedTransactionError extends Error {
  constructor() {
    super(
      "Transaction API error: Nested transactions are not supported. Do not call $transaction inside an active transaction.",
    );
    this.name = "GassmaNestedTransactionError";
  }
}

export {
  GassmaNestedTransactionError,
  GassmaTransactionLockTimeoutError,
  GassmaTransactionTimeoutError,
};
