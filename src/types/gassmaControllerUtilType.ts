import type { FieldMapping } from "../util/map/mapFields";
import type { SheetReader } from "../util/read/sheetReader";
import type { SheetWriter } from "../util/write/sheetWriter";

type WhereValidation = {
  ignoredFields: string[];
  relationNames: string[];
};

type GassmaControllerUtil = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  startRowNumber: number;
  startColumnNumber: number;
  endColumnNumber: number;
  fieldMapping?: FieldMapping;
  writer?: SheetWriter;
  reader?: SheetReader;
  whereValidation?: WhereValidation;
};

export type { GassmaControllerUtil, WhereValidation };
