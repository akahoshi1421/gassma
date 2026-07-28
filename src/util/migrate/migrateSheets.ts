import { GassmaMissingArgumentError } from "../../errors/argument/argumentError";
import type {
  MigrateModel,
  MigrateSheetsOptions,
} from "../../types/migrateTypes";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;

const LOG_PREFIX = "Gassma.migrateSheets:";

const readHeaders = (sheet: Sheet): string[] => {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return [];
  const titles = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return titles.map((title) => String(title));
};

const createSheetWithHeaders = (
  spreadsheet: Spreadsheet,
  model: MigrateModel,
) => {
  const sheet = spreadsheet.insertSheet(model.name);
  if (model.columns.length > 0) {
    sheet.getRange(1, 1, 1, model.columns.length).setValues([model.columns]);
  }
  console.log(
    `${LOG_PREFIX} created sheet "${model.name}" with columns [${model.columns.join(", ")}]`,
  );
};

const warnExtraColumns = (headers: string[], model: MigrateModel) => {
  headers.forEach((header) => {
    if (header === "" || model.columns.includes(header)) return;
    console.warn(
      `${LOG_PREFIX} column "${header}" on sheet "${model.name}" is not in the schema. It is left untouched.`,
    );
  });
};

const appendMissingColumns = (sheet: Sheet, model: MigrateModel) => {
  const headers = readHeaders(sheet);
  const missingColumns = model.columns.filter(
    (column) => !headers.includes(column),
  );
  if (missingColumns.length === 0) {
    console.log(`${LOG_PREFIX} sheet "${model.name}" is up to date`);
  } else {
    sheet
      .getRange(1, headers.length + 1, 1, missingColumns.length)
      .setValues([missingColumns]);
    console.log(
      `${LOG_PREFIX} added columns [${missingColumns.join(", ")}] to sheet "${model.name}"`,
    );
  }
  warnExtraColumns(headers, model);
};

const warnExtraSheets = (spreadsheet: Spreadsheet, models: MigrateModel[]) => {
  const modelNames = models.map((model) => model.name);
  spreadsheet.getSheets().forEach((sheet) => {
    const sheetName = sheet.getName();
    if (modelNames.includes(sheetName)) return;
    console.warn(
      `${LOG_PREFIX} sheet "${sheetName}" is not in the schema. It is left untouched.`,
    );
  });
};

/**
 * Synchronizes the spreadsheet with the given models like `prisma db push`:
 * missing sheets are created and missing columns are appended, idempotently.
 * Assumes the header row is row 1 starting at column A on every sheet
 * (header positions moved via changeSettings are not supported).
 * Never deletes or reorders existing sheets/columns, never touches data rows.
 */
const migrateSheets = (options: MigrateSheetsOptions): void => {
  if (!options || !options.models) {
    throw new GassmaMissingArgumentError("models");
  }
  const spreadsheet = options.spreadsheetId
    ? SpreadsheetApp.openById(options.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  options.models.forEach((model) => {
    const sheet = spreadsheet.getSheetByName(model.name);
    if (sheet === null) {
      createSheetWithHeaders(spreadsheet, model);
      return;
    }
    appendMissingColumns(sheet, model);
  });

  warnExtraSheets(spreadsheet, options.models);
};

export { migrateSheets };
