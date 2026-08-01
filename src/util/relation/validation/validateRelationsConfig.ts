import { RelationSheetNotFoundError } from "../../../errors/relation/relationValidationError";
import {
  type GetColumnHeaders,
  validateColumnExistence,
} from "./validateColumnExistence";
import {
  type GetIgnoredFields,
  validateIgnoredColumns,
} from "./validateIgnoredColumns";
import { validateRelationDefinition } from "./validateRelationDefinition";

const validateRelationsConfig = (
  relations: Record<string, Record<string, Record<string, unknown>>>,
  sheets: Record<string, unknown>,
  getColumnHeaders: GetColumnHeaders,
  getIgnoredFields?: GetIgnoredFields,
): void => {
  const allSheetNames = Object.keys(sheets);

  Object.keys(relations).forEach((sheetName) => {
    if (!(sheetName in sheets)) {
      throw new RelationSheetNotFoundError(sheetName);
    }

    const sheetRelations = relations[sheetName];

    Object.keys(sheetRelations).forEach((relationName) => {
      const definition = sheetRelations[relationName];

      validateRelationDefinition(
        sheetName,
        relationName,
        definition,
        allSheetNames,
      );

      const checkedDefinition = definition as {
        type: string;
        to: string;
        field: string;
        reference: string;
        through?: { sheet: string; field: string; reference: string };
      };

      validateColumnExistence(
        sheetName,
        relationName,
        checkedDefinition,
        getColumnHeaders,
      );

      if (getIgnoredFields) {
        validateIgnoredColumns(
          sheetName,
          relationName,
          checkedDefinition,
          getIgnoredFields,
        );
      }
    });
  });
};

export { validateRelationsConfig };
