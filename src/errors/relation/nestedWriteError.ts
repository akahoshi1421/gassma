class NestedWriteConnectNotFoundError extends Error {
  constructor(sheetName: string) {
    super(`Nested write connect failed: no record found in "${sheetName}"`);
    this.name = "NestedWriteConnectNotFoundError";
  }
}

class NestedWriteRelationNotFoundError extends Error {
  constructor(fieldName: string) {
    super(`Nested write failed: "${fieldName}" is not a defined relation`);
    this.name = "NestedWriteRelationNotFoundError";
  }
}

class NestedWriteInvalidOperationError extends Error {
  constructor(relationName: string, operation: string, relationType: string) {
    super(
      `Nested write: operation "${operation}" is not valid for relation "${relationName}" of type "${relationType}"`,
    );
    this.name = "NestedWriteInvalidOperationError";
  }
}

class NestedWriteWithoutRelationsError extends Error {
  constructor() {
    super(
      "Cannot use nested write operations without defining relations in GassmaClient",
    );
    this.name = "NestedWriteWithoutRelationsError";
  }
}

export {
  NestedWriteConnectNotFoundError,
  NestedWriteRelationNotFoundError,
  NestedWriteInvalidOperationError,
  NestedWriteWithoutRelationsError,
};
