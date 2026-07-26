import { GassmaTransactionRollbackError } from "../../errors/transaction/transactionError";
import type { TransactionBuffer } from "./transactionBuffer";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;

const MARKER_KEY_PREFIX = "gassma_tx_backup_";
const BACKUP_NAME_PREFIX = "_gassma_tx_";
const SHEET_NAME_MAX_LENGTH = 100;

type BackupEntry = { original: Sheet; backup: Sheet; backupName: string };

type TransactionBackup = {
  spreadsheet: Spreadsheet;
  markerKey: string;
  entries: BackupEntry[];
};

const buildBackupName = (
  timestamp: number,
  sheetName: string,
  index: number,
): string => {
  const base = `${BACKUP_NAME_PREFIX}${timestamp}_${sheetName}`;
  if (base.length <= SHEET_NAME_MAX_LENGTH) return base;
  const suffix = `_${index}`;
  return base.slice(0, SHEET_NAME_MAX_LENGTH - suffix.length) + suffix;
};

const warnStaleTransactionBackups = () => {
  const props = PropertiesService.getScriptProperties();
  props.getKeys().forEach((key) => {
    if (!key.startsWith(MARKER_KEY_PREFIX)) return;
    console.warn(
      `Gassma: a stale transaction backup marker was found (${key} = ${props.getProperty(key)}). A previous transaction may have been interrupted before it completed. The listed backup sheets are kept for manual recovery.`,
    );
  });
};

const deleteBackupSheetQuietly = (
  spreadsheet: Spreadsheet,
  entry: BackupEntry,
): boolean => {
  try {
    spreadsheet.deleteSheet(entry.backup);
    return true;
  } catch {
    return false;
  }
};

const createTransactionBackup = (sheets: Sheet[]): TransactionBackup => {
  const spreadsheet = sheets[0].getParent();
  const timestamp = Date.now();
  const entries: BackupEntry[] = [];
  try {
    sheets.forEach((original, index) => {
      const backupName = buildBackupName(timestamp, original.getName(), index);
      const backup = original.copyTo(spreadsheet);
      entries.push({ original, backup, backupName });
      backup.setName(backupName);
      backup.hideSheet();
    });
  } catch (error) {
    entries.forEach((entry) => {
      deleteBackupSheetQuietly(spreadsheet, entry);
    });
    throw error;
  }
  const markerKey = `${MARKER_KEY_PREFIX}${spreadsheet.getId()}`;
  PropertiesService.getScriptProperties().setProperty(
    markerKey,
    JSON.stringify(entries.map((entry) => entry.backupName)),
  );
  return { spreadsheet, markerKey, entries };
};

const restoreSheetContent = (original: Sheet, backup: Sheet) => {
  const lastRow = backup.getLastRow();
  const lastColumn = backup.getLastColumn();
  original.clearContents();
  if (lastRow < 1 || lastColumn < 1) return;
  const range = backup.getRange(1, 1, lastRow, lastColumn);
  const values: unknown[][] = range.getValues();
  const formulas = range.getFormulas();
  const merged = values.map((row, rowIndex) =>
    row.map((value, columnIndex) => {
      const formula = formulas[rowIndex][columnIndex];
      return formula === "" ? value : formula;
    }),
  );
  original.getRange(1, 1, lastRow, lastColumn).setValues(merged);
};

const restoreTransactionBackup = (backup: TransactionBackup) => {
  try {
    backup.entries.forEach((entry) => {
      restoreSheetContent(entry.original, entry.backup);
    });
  } catch {
    throw new GassmaTransactionRollbackError(
      backup.entries.map((entry) => entry.backupName),
    );
  }
};

const cleanupTransactionBackup = (backup: TransactionBackup) => {
  const allDeleted = backup.entries
    .map((entry) => deleteBackupSheetQuietly(backup.spreadsheet, entry))
    .every((deleted) => deleted);
  if (!allDeleted) {
    console.warn(
      `Gassma: failed to delete some transaction backup sheets. The marker (${backup.markerKey}) is kept so the next transaction can report them.`,
    );
    return;
  }
  PropertiesService.getScriptProperties().deleteProperty(backup.markerKey);
};

const flushWithBackup = (buffer: TransactionBuffer) => {
  const sheets = buffer.affectedSheets();
  if (sheets.length === 0) {
    buffer.flush();
    return;
  }
  const backup = createTransactionBackup(sheets);
  try {
    buffer.flush();
  } catch (flushError) {
    restoreTransactionBackup(backup);
    cleanupTransactionBackup(backup);
    throw flushError;
  }
  cleanupTransactionBackup(backup);
};

export { buildBackupName, flushWithBackup, warnStaleTransactionBackups };
