import { RelationColumnNotFoundError } from "../../../errors/relation/relationValidationError";

type GetColumnHeaders = (sheetName: string) => string[];

interface ThroughConfig {
  sheet: string;
  field: string;
  reference: string;
}

interface RelationForColumnCheck {
  type: string;
  to: string;
  field: string;
  reference: string;
  through?: ThroughConfig;
}

const assertColumnExists = (
  sheetName: string,
  columnName: string,
  headers: string[],
): void => {
  if (!headers.includes(columnName)) {
    throw new RelationColumnNotFoundError(sheetName, columnName);
  }
};

const validateColumnExistence = (
  sourceSheetName: string,
  _relationName: string,
  definition: RelationForColumnCheck,
  getColumnHeaders: GetColumnHeaders,
): void => {
  const sourceHeaders = getColumnHeaders(sourceSheetName);
  assertColumnExists(sourceSheetName, definition.field, sourceHeaders);

  const targetHeaders = getColumnHeaders(definition.to);
  assertColumnExists(definition.to, definition.reference, targetHeaders);

  if (definition.type === "manyToMany" && definition.through) {
    const throughHeaders = getColumnHeaders(definition.through.sheet);
    assertColumnExists(
      definition.through.sheet,
      definition.through.field,
      throughHeaders,
    );
    assertColumnExists(
      definition.through.sheet,
      definition.through.reference,
      throughHeaders,
    );
  }
};

export { validateColumnExistence };
export type { GetColumnHeaders };
