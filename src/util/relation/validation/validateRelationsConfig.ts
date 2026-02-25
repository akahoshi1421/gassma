import { RelationSheetNotFoundError } from "../../../errors/relation/relationValidationError";
import { validateRelationDefinition } from "./validateRelationDefinition";
import {
  validateColumnExistence,
  type GetColumnHeaders,
} from "./validateColumnExistence";

const validateRelationsConfig = (
  relations: Record<string, Record<string, Record<string, unknown>>>,
  sheets: Record<string, unknown>,
  getColumnHeaders: GetColumnHeaders,
): void => {
  const allSheetNames = Object.keys(sheets);

  for (const sheetName of Object.keys(relations)) {
    if (!(sheetName in sheets)) {
      throw new RelationSheetNotFoundError(sheetName);
    }

    const sheetRelations = relations[sheetName];

    for (const relationName of Object.keys(sheetRelations)) {
      const definition = sheetRelations[relationName];

      validateRelationDefinition(
        sheetName,
        relationName,
        definition,
        allSheetNames,
      );

      validateColumnExistence(
        sheetName,
        relationName,
        definition as {
          type: string;
          to: string;
          field: string;
          reference: string;
          through?: { sheet: string; field: string; reference: string };
        },
        getColumnHeaders,
      );
    }
  }
};

export { validateRelationsConfig };
