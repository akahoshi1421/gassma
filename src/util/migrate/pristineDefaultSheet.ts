import type { MigrateModel } from "../../types/migrateTypes";
import { LOG_PREFIX } from "./logPrefix";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;

const isPristine = (sheet: Sheet): boolean =>
  sheet.getLastRow() === 0 && sheet.getLastColumn() === 0;

/**
 * Finds the empty sheet Google puts in every new spreadsheet ("Sheet1").
 * Only matches while the spreadsheet holds that single sheet, so it must be
 * called before the model sheets are created.
 */
const findPristineDefaultSheet = (
  spreadsheet: Spreadsheet,
  models: MigrateModel[],
): Sheet | null => {
  const sheets = spreadsheet.getSheets();
  if (sheets.length !== 1) return null;
  const sheet = sheets[0];
  if (models.some((model) => model.name === sheet.getName())) return null;
  if (!isPristine(sheet)) return null;
  return sheet;
};

/**
 * Deletes the sheet found by `findPristineDefaultSheet`, once the model sheets
 * exist. Keeps it when it is the only sheet left, since a spreadsheet must
 * contain at least one sheet.
 */
const dropPristineDefaultSheet = (
  spreadsheet: Spreadsheet,
  sheet: Sheet | null,
): void => {
  if (sheet === null) return;
  if (spreadsheet.getSheets().length <= 1) return;
  const sheetName = sheet.getName();
  spreadsheet.deleteSheet(sheet);
  console.log(`${LOG_PREFIX} deleted the empty default sheet "${sheetName}"`);
};

export { dropPristineDefaultSheet, findPristineDefaultSheet };
