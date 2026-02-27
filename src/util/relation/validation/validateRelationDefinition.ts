import {
  RelationMissingPropertyError,
  RelationInvalidPropertyTypeError,
  RelationInvalidTypeError,
  RelationSheetNotFoundError,
  RelationInvalidOnDeleteError,
} from "../../../errors/relation/relationValidationError";

const VALID_RELATION_TYPES = [
  "oneToMany",
  "oneToOne",
  "manyToOne",
  "manyToMany",
];

const VALID_ON_DELETE_ACTIONS = ["Cascade", "SetNull", "Restrict", "NoAction"];

const REQUIRED_PROPERTIES = ["type", "to", "field", "reference"] as const;

const THROUGH_REQUIRED_PROPERTIES = ["sheet", "field", "reference"] as const;

const assertStringProperty = (
  sheetName: string,
  relationName: string,
  obj: Record<string, unknown>,
  property: string,
): void => {
  if (!(property in obj) || obj[property] === undefined) {
    throw new RelationMissingPropertyError(sheetName, relationName, property);
  }
  if (typeof obj[property] !== "string") {
    throw new RelationInvalidPropertyTypeError(
      sheetName,
      relationName,
      property,
      "string",
    );
  }
};

const validateRelationDefinition = (
  sheetName: string,
  relationName: string,
  definition: Record<string, unknown>,
  allSheetNames: string[],
): void => {
  REQUIRED_PROPERTIES.forEach((prop) => {
    assertStringProperty(sheetName, relationName, definition, prop);
  });

  const type = definition.type as string;
  if (!VALID_RELATION_TYPES.includes(type)) {
    throw new RelationInvalidTypeError(sheetName, relationName, type);
  }

  const to = definition.to as string;
  if (!allSheetNames.includes(to)) {
    throw new RelationSheetNotFoundError(to);
  }

  if (
    definition.onDelete !== undefined &&
    !VALID_ON_DELETE_ACTIONS.includes(definition.onDelete as string)
  ) {
    throw new RelationInvalidOnDeleteError(
      sheetName,
      relationName,
      String(definition.onDelete),
    );
  }

  if (type === "manyToMany") {
    if (!definition.through || typeof definition.through !== "object") {
      throw new RelationMissingPropertyError(
        sheetName,
        relationName,
        "through",
      );
    }

    const through = definition.through as Record<string, unknown>;

    THROUGH_REQUIRED_PROPERTIES.forEach((prop) => {
      if (!(prop in through) || through[prop] === undefined) {
        throw new RelationMissingPropertyError(
          sheetName,
          relationName,
          `through.${prop}`,
        );
      }
      if (typeof through[prop] !== "string") {
        throw new RelationInvalidPropertyTypeError(
          sheetName,
          relationName,
          `through.${prop}`,
          "string",
        );
      }
    });

    const throughSheet = through.sheet as string;
    if (!allSheetNames.includes(throughSheet)) {
      throw new RelationSheetNotFoundError(throughSheet);
    }
  }
};

export { validateRelationDefinition };
