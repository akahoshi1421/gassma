class WhereRelationInvalidFilterError extends Error {
  constructor(relationName: string, relationType: string, filterType: string) {
    super(
      `Filter "${filterType}" cannot be used on relation "${relationName}" of type "${relationType}"`,
    );
    this.name = "WhereRelationInvalidFilterError";
  }
}

class WhereRelationWithoutContextError extends Error {
  constructor() {
    super(
      "Cannot use relation filters in where clause without defining relations",
    );
    this.name = "WhereRelationWithoutContextError";
  }
}

export { WhereRelationInvalidFilterError, WhereRelationWithoutContextError };
