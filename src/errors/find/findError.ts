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

class GassmaSkipNegativeError extends Error {
  constructor(value: number) {
    super(
      `Invalid value for skip argument: Value can only be positive, found: ${value}`,
    );
    this.name = "GassmaSkipNegativeError";
  }
}

class GassmaLimitNegativeError extends Error {
  constructor(value: number) {
    super(
      `Invalid value for limit argument: Value can only be positive, found: ${value}`,
    );
    this.name = "GassmaLimitNegativeError";
  }
}

class RelationOrderByUnsupportedTypeError extends Error {
  constructor(relationName: string, relationType: string) {
    super(
      `Cannot use orderBy on "${relationName}" (type: ${relationType}). Only manyToOne and oneToOne are supported.`,
    );
    this.name = "RelationOrderByUnsupportedTypeError";
  }
}

export {
  GassmaFindSelectOmitConflictError,
  NotFoundError,
  GassmaSkipNegativeError,
  GassmaLimitNegativeError,
  RelationOrderByUnsupportedTypeError,
};
