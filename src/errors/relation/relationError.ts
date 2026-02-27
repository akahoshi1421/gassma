class GassmaRelationNotFoundError extends Error {
  constructor(relationName: string, sheetName: string) {
    super(`Relation "${relationName}" is not defined for sheet "${sheetName}"`);
  }
}

class GassmaTargetSheetNotFoundError extends Error {
  constructor(targetSheetName: string) {
    super(`Target sheet "${targetSheetName}" is not accessible`);
  }
}

class GassmaThroughRequiredError extends Error {
  constructor(relationName: string) {
    super(
      `Relation "${relationName}" is manyToMany but "through" is not defined`,
    );
  }
}

class GassmaIncludeSelectConflictError extends Error {
  constructor() {
    super("Cannot use both include and select in the same query");
  }
}

class GassmaRelationDuplicateError extends Error {
  constructor(sheetName: string, field: string, value: unknown) {
    super(
      `Duplicate value "${String(value)}" found in "${sheetName}.${field}" for a unique relation`,
    );
  }
}

class RelationOnDeleteRestrictError extends Error {
  constructor(relationName: string) {
    super(
      `Cannot delete: related records exist for relation "${relationName}" (onDelete: Restrict)`,
    );
    this.name = "RelationOnDeleteRestrictError";
  }
}

export {
  GassmaRelationNotFoundError,
  GassmaTargetSheetNotFoundError,
  GassmaThroughRequiredError,
  GassmaIncludeSelectConflictError,
  GassmaRelationDuplicateError,
  RelationOnDeleteRestrictError,
};
