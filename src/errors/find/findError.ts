class GassmaFindSelectOmitConflictError extends Error {
  constructor() {
    super("Cannot use both select and omit in the same query");
  }
}

export { GassmaFindSelectOmitConflictError };