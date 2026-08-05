class GassmaAutoincrementNotConfiguredError extends Error {
  constructor(sheetName: string, field: string, configuredFields: string[]) {
    const configured = Array.isArray(configuredFields) ? configuredFields : [];
    const tail =
      configured.length === 0
        ? `\n\nSheet \`${sheetName}\` has no autoincrement fields.`
        : `\n\nAutoincrement fields on \`${sheetName}\`: ${configured.join(", ")}`;
    super(
      `Field \`${field}\` on \`${sheetName}\` is not configured with autoincrement.${tail}`,
    );
    this.name = "GassmaAutoincrementNotConfiguredError";
  }
}

class GassmaAutoincrementInTransactionError extends Error {
  constructor(methodName: string) {
    super(
      `\`${methodName}\` cannot be called inside $transaction. The autoincrement counter lives in ScriptProperties, so it is not rolled back when the transaction fails. Call it outside $transaction.`,
    );
    this.name = "GassmaAutoincrementInTransactionError";
  }
}

export {
  GassmaAutoincrementInTransactionError,
  GassmaAutoincrementNotConfiguredError,
};
