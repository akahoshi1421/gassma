import {
  RelationMissingPropertyError,
  RelationInvalidPropertyTypeError,
  RelationInvalidTypeError,
  RelationSheetNotFoundError,
} from "../../../errors/relation/relationValidationError";

const VALID_RELATION_TYPES = [
  "oneToMany",
  "oneToOne",
  "manyToOne",
  "manyToMany",
];

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
  for (const prop of REQUIRED_PROPERTIES) {
    assertStringProperty(sheetName, relationName, definition, prop);
  }

  const type = definition.type as string;
  if (!VALID_RELATION_TYPES.includes(type)) {
    throw new RelationInvalidTypeError(sheetName, relationName, type);
  }

  const to = definition.to as string;
  if (!allSheetNames.includes(to)) {
    throw new RelationSheetNotFoundError(to);
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

    for (const prop of THROUGH_REQUIRED_PROPERTIES) {
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
    }

    const throughSheet = through.sheet as string;
    if (!allSheetNames.includes(throughSheet)) {
      throw new RelationSheetNotFoundError(throughSheet);
    }
  }
};

export { validateRelationDefinition };
