import type { FieldMapping } from "../util/map/mapFields";

type GassmaControllerUtil = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  startRowNumber: number;
  startColumnNumber: number;
  endColumnNumber: number;
  fieldMapping?: FieldMapping;
};

export type { GassmaControllerUtil };
