class RelationSheetNotFoundError extends Error {
  constructor(sheetName: string) {
    super(`Sheet "${sheetName}" is not found in the spreadsheet`);
    this.name = "RelationSheetNotFoundError";
  }
}

class RelationMissingPropertyError extends Error {
  constructor(sheetName: string, relationName: string, property: string) {
    super(
      `Relation "${relationName}" on sheet "${sheetName}" is missing required property "${property}"`,
    );
    this.name = "RelationMissingPropertyError";
  }
}

class RelationInvalidPropertyTypeError extends Error {
  constructor(
    sheetName: string,
    relationName: string,
    property: string,
    expectedType: string,
  ) {
    super(
      `Relation "${relationName}" on sheet "${sheetName}": property "${property}" must be a ${expectedType}`,
    );
    this.name = "RelationInvalidPropertyTypeError";
  }
}

class RelationInvalidTypeError extends Error {
  constructor(sheetName: string, relationName: string, value: string) {
    super(
      `Relation "${relationName}" on sheet "${sheetName}": type "${value}" is not valid. Must be one of: oneToMany, oneToOne, manyToOne, manyToMany`,
    );
    this.name = "RelationInvalidTypeError";
  }
}

class RelationColumnNotFoundError extends Error {
  constructor(sheetName: string, columnName: string) {
    super(`Column "${columnName}" is not found in sheet "${sheetName}"`);
    this.name = "RelationColumnNotFoundError";
  }
}

class IncludeWithoutRelationsError extends Error {
  constructor() {
    super("Cannot use include without defining relations in GassmaClient");
    this.name = "IncludeWithoutRelationsError";
  }
}

class IncludeInvalidOptionTypeError extends Error {
  constructor(relationName: string, option: string, expectedType: string) {
    super(
      `Include "${relationName}": option "${option}" must be ${expectedType}`,
    );
    this.name = "IncludeInvalidOptionTypeError";
  }
}

class IncludeSelectOmitConflictError extends Error {
  constructor(relationName: string) {
    super(
      `Include "${relationName}": cannot use both select and omit at the same time`,
    );
    this.name = "IncludeSelectOmitConflictError";
  }
}

class IncludeSelectIncludeConflictError extends Error {
  constructor(relationName: string) {
    super(
      `Include "${relationName}": cannot use both select and include at the same time`,
    );
    this.name = "IncludeSelectIncludeConflictError";
  }
}

class RelationInvalidOnDeleteError extends Error {
  constructor(sheetName: string, relationName: string, value: string) {
    super(
      `Relation "${relationName}" on sheet "${sheetName}": onDelete "${value}" is not valid. Must be one of: Cascade, SetNull, Restrict, NoAction`,
    );
    this.name = "RelationInvalidOnDeleteError";
  }
}

class RelationInvalidOnUpdateError extends Error {
  constructor(sheetName: string, relationName: string, value: string) {
    super(
      `Relation "${relationName}" on sheet "${sheetName}": onUpdate "${value}" is not valid. Must be one of: Cascade, SetNull, Restrict, NoAction`,
    );
    this.name = "RelationInvalidOnUpdateError";
  }
}

export {
  RelationSheetNotFoundError,
  RelationMissingPropertyError,
  RelationInvalidPropertyTypeError,
  RelationInvalidTypeError,
  RelationColumnNotFoundError,
  IncludeWithoutRelationsError,
  IncludeInvalidOptionTypeError,
  IncludeSelectOmitConflictError,
  IncludeSelectIncludeConflictError,
  RelationInvalidOnDeleteError,
  RelationInvalidOnUpdateError,
};
