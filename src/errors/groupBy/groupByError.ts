class GassmaGroupByHavingDontWriteByError extends Error {
  constructor() {
    super(
      "When using “having” other than “_avg”, “_count”, “_max”, “_min”, and “_sum”, column names can be used only if they are written in the “by” field."
    );
  }
}

export { GassmaGroupByHavingDontWriteByError };
