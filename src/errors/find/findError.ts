class GassmaFindSelectOmitConflictError extends Error {
  constructor() {
    super("Cannot use both select and omit in the same query");
  }
}

class NotFoundError extends Error {
  constructor() {
    super(
      "An operation failed because it depends on one or more records that were required but not found. Expected a record, got nothing.",
    );
    this.name = "NotFoundError";
  }
}

export { GassmaFindSelectOmitConflictError, NotFoundError };
