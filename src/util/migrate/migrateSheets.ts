import { GassmaMissingArgumentError } from "../../errors/argument/argumentError";
import type {
  MigrateModel,
  MigrateSheetsOptions,
} from "../../types/migrateTypes";
import { LOG_PREFIX } from "./logPrefix";
import {
  dropPristineDefaultSheet,
  findPristineDefaultSheet,
} from "./pristineDefaultSheet";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;

const readHeaders = (sheet: Sheet): string[] => {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return [];
  const titles = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return titles.map((title) => String(title));
};

const ensureColumnCapacity = (sheet: Sheet, requiredColumns: number) => {
  const maxColumns = sheet.getMaxColumns();
  if (requiredColumns <= maxColumns) return;
  sheet.insertColumnsAfter(maxColumns, requiredColumns - maxColumns);
};

const createSheetWithHeaders = (
  spreadsheet: Spreadsheet,
  model: MigrateModel,
) => {
  const sheet = spreadsheet.insertSheet(model.name);
  if (model.columns.length > 0) {
    ensureColumnCapacity(sheet, model.columns.length);
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

const appendMissingColumns = (
  sheet: Sheet,
  model: MigrateModel,
  headers: string[],
) => {
  const missingColumns = model.columns.filter(
    (column) => !headers.includes(column),
  );
  if (missingColumns.length === 0) {
    console.log(`${LOG_PREFIX} sheet "${model.name}" is up to date`);
    return;
  }
  ensureColumnCapacity(sheet, headers.length + missingColumns.length);
  sheet
    .getRange(1, headers.length + 1, 1, missingColumns.length)
    .setValues([missingColumns]);
  console.log(
    `${LOG_PREFIX} added columns [${missingColumns.join(", ")}] to sheet "${model.name}"`,
  );
};

const listExtraColumns = (headers: string[], model: MigrateModel) =>
  headers
    .map((header, index) => ({ header, position: index + 1 }))
    .filter(({ header }) => header !== "" && !model.columns.includes(header));

const countNonEmptyDataCells = (sheet: Sheet, columnPosition: number) => {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, columnPosition, lastRow - 1, 1).getValues();
  return values.filter((row) => row[0] !== "").length;
};

const dropExtraColumns = (
  sheet: Sheet,
  model: MigrateModel,
  headers: string[],
) => {
  const extraColumns = listExtraColumns(headers, model);
  extraColumns.forEach(({ header, position }) => {
    const count = countNonEmptyDataCells(sheet, position);
    if (count < 1) return;
    console.warn(
      `${LOG_PREFIX} You are about to drop the column "${header}" on the sheet "${model.name}", which still contains ${count} non-empty values.`,
    );
  });
  [...extraColumns].reverse().forEach(({ position }) => {
    sheet.deleteColumn(position);
  });
};

const syncExistingSheet = (
  sheet: Sheet,
  model: MigrateModel,
  acceptDataLoss: boolean,
) => {
  const headers = readHeaders(sheet);
  appendMissingColumns(sheet, model, headers);
  if (acceptDataLoss) {
    dropExtraColumns(sheet, model, headers);
    return;
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

const dropExtraSheets = (spreadsheet: Spreadsheet, models: MigrateModel[]) => {
  const modelNames = models.map((model) => model.name);
  const extraSheets = spreadsheet
    .getSheets()
    .filter((sheet) => !modelNames.includes(sheet.getName()));
  extraSheets.forEach((sheet) => {
    const sheetName = sheet.getName();
    if (spreadsheet.getSheets().length <= 1) {
      console.warn(
        `${LOG_PREFIX} sheet "${sheetName}" is not in the schema but cannot be deleted because a spreadsheet must contain at least one sheet. It is left untouched.`,
      );
      return;
    }
    const dataRows = Math.max(sheet.getLastRow() - 1, 0);
    if (dataRows >= 1) {
      console.warn(
        `${LOG_PREFIX} You are about to drop the sheet "${sheetName}", which still contains ${dataRows} rows.`,
      );
    }
    spreadsheet.deleteSheet(sheet);
  });
};

/**
 * Synchronizes the spreadsheet with the given models like `prisma db push`:
 * missing sheets are created and missing columns are appended, idempotently.
 * Assumes the header row is row 1 starting at column A on every sheet
 * (header positions moved via changeSettings are not supported).
 * Columns and sheets not in the schema are only warned about by default;
 * with `acceptDataLoss: true` they are dropped after a warning that reports
 * how much data they still contain (silently when they are empty; the last
 * remaining sheet is kept, since a spreadsheet must contain at least one
 * sheet). The empty sheet Google puts in every new spreadsheet is dropped
 * regardless of `acceptDataLoss`, as it holds no data. Never reorders existing
 * columns, never writes to data rows.
 */
const migrateSheets = (options: MigrateSheetsOptions): void => {
  if (!options || !options.models) {
    throw new GassmaMissingArgumentError("models");
  }
  const acceptDataLoss = options.acceptDataLoss === true;
  const spreadsheet = options.spreadsheetId
    ? SpreadsheetApp.openById(options.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  const pristineDefaultSheet = findPristineDefaultSheet(
    spreadsheet,
    options.models,
  );

  options.models.forEach((model) => {
    const sheet = spreadsheet.getSheetByName(model.name);
    if (sheet === null) {
      createSheetWithHeaders(spreadsheet, model);
      return;
    }
    syncExistingSheet(sheet, model, acceptDataLoss);
  });

  dropPristineDefaultSheet(spreadsheet, pristineDefaultSheet);

  if (acceptDataLoss) {
    dropExtraSheets(spreadsheet, options.models);
    return;
  }
  warnExtraSheets(spreadsheet, options.models);
};

export { migrateSheets };
