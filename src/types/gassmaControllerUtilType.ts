import type { FieldMapping } from "../util/map/mapFields";
import type { SheetWriter } from "../util/write/sheetWriter";

type GassmaControllerUtil = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  startRowNumber: number;
  startColumnNumber: number;
  endColumnNumber: number;
  fieldMapping?: FieldMapping;
  writer?: SheetWriter;
};

export type { GassmaControllerUtil };
