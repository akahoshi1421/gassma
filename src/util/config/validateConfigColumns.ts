import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
import type {
  AutoincrementConfig,
  DefaultsConfig,
  GlobalOmitConfig,
  IgnoreConfig,
  MapConfig,
  UpdatedAtConfig,
} from "../../types/relationTypes";

type GetColumnHeaders = (sheetName: string) => string[];

type ConfigForColumnCheck = {
  omit?: GlobalOmitConfig;
  defaults?: DefaultsConfig;
  updatedAt?: UpdatedAtConfig;
  autoincrement?: AutoincrementConfig;
  ignore?: IgnoreConfig;
  map?: MapConfig;
};

const toArray = (value: string | string[]): string[] =>
  Array.isArray(value) ? value : [value];

const assertColumnsExist = (columnNames: string[], headers: string[]): void => {
  columnNames.forEach((columnName) => {
    if (!headers.includes(columnName)) {
      throw new GassmaUnknownArgumentError(columnName, headers);
    }
  });
};

const validateMapColumns = (
  mapping: { [codeName: string]: string },
  headers: string[],
): void => {
  const codeNames = new Set(Object.keys(mapping));
  const rawHeaders = headers.map((header) =>
    codeNames.has(header) ? mapping[header] : header,
  );
  Object.keys(mapping).forEach((codeName) => {
    if (!rawHeaders.includes(mapping[codeName])) {
      throw new GassmaUnknownArgumentError(mapping[codeName], rawHeaders);
    }
  });
};

const collectSheetNames = (config: ConfigForColumnCheck): string[] => {
  const sections = [
    config.map,
    config.defaults,
    config.updatedAt,
    config.autoincrement,
    config.ignore,
    config.omit,
  ];
  const names: string[] = [];
  sections.forEach((section) => {
    if (!section) return;
    Object.keys(section).forEach((sheetName) => {
      if (!names.includes(sheetName)) names.push(sheetName);
    });
  });
  return names;
};

const validateSheetConfigColumns = (
  config: ConfigForColumnCheck,
  sheetName: string,
  headers: string[],
): void => {
  const mapping = config.map?.[sheetName];
  if (mapping) validateMapColumns(mapping, headers);

  const defaults = config.defaults?.[sheetName];
  if (defaults) assertColumnsExist(Object.keys(defaults), headers);

  const updatedAt = config.updatedAt?.[sheetName];
  if (updatedAt) assertColumnsExist(toArray(updatedAt), headers);

  const autoincrement = config.autoincrement?.[sheetName];
  if (autoincrement) assertColumnsExist(toArray(autoincrement), headers);

  const ignore = config.ignore?.[sheetName];
  if (ignore) assertColumnsExist(toArray(ignore), headers);

  const omit = config.omit?.[sheetName];
  if (omit) assertColumnsExist(Object.keys(omit), headers);
};

const validateConfigColumns = (
  config: ConfigForColumnCheck,
  sheets: Record<string, unknown>,
  getColumnHeaders: GetColumnHeaders,
): void => {
  collectSheetNames(config).forEach((sheetName) => {
    if (!(sheetName in sheets)) return;
    validateSheetConfigColumns(config, sheetName, getColumnHeaders(sheetName));
  });
};

export { validateConfigColumns };
export type { ConfigForColumnCheck, GetColumnHeaders };
