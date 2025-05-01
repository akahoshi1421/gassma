import { SchemaType } from "./core/schemaType";

type GassmaControllerUtil = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  startRowNumber: number;
  startColumnNumber: number;
  endColumnNumber: number;
  schema: SchemaType | undefined;
};

export { GassmaControllerUtil };
