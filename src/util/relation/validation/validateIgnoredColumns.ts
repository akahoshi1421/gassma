import { RelationIgnoredColumnError } from "../../../errors/relation/relationValidationError";

type GetIgnoredFields = (sheetName: string) => string[];

interface ThroughConfig {
  sheet: string;
  field: string;
  reference: string;
}

interface RelationForIgnoreCheck {
  type: string;
  to: string;
  field: string;
  reference: string;
  through?: ThroughConfig;
}

const assertColumnNotIgnored = (
  sourceSheetName: string,
  relationName: string,
  sheetName: string,
  columnName: string,
  getIgnoredFields: GetIgnoredFields,
): void => {
  if (getIgnoredFields(sheetName).includes(columnName)) {
    throw new RelationIgnoredColumnError(
      sourceSheetName,
      relationName,
      columnName,
      sheetName,
    );
  }
};

const validateIgnoredColumns = (
  sourceSheetName: string,
  relationName: string,
  definition: RelationForIgnoreCheck,
  getIgnoredFields: GetIgnoredFields,
): void => {
  assertColumnNotIgnored(
    sourceSheetName,
    relationName,
    sourceSheetName,
    definition.field,
    getIgnoredFields,
  );

  assertColumnNotIgnored(
    sourceSheetName,
    relationName,
    definition.to,
    definition.reference,
    getIgnoredFields,
  );

  if (definition.type === "manyToMany" && definition.through) {
    assertColumnNotIgnored(
      sourceSheetName,
      relationName,
      definition.through.sheet,
      definition.through.field,
      getIgnoredFields,
    );
    assertColumnNotIgnored(
      sourceSheetName,
      relationName,
      definition.through.sheet,
      definition.through.reference,
      getIgnoredFields,
    );
  }
};

export { validateIgnoredColumns };
export type { GetIgnoredFields };
