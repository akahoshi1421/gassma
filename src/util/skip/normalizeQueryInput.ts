import {
  GassmaSkipInArrayError,
  GassmaUndefinedValueError,
} from "../../errors/skip/skipError";
import { isDict } from "../other/isDict";
import { isSkipValue } from "./skip";

const joinPath = (path: string, key: string): string =>
  path === "" ? key : `${path}.${key}`;

const normalizeArray = (
  values: unknown[],
  strict: boolean,
  path: string,
): unknown[] =>
  values.map((value, index) => {
    const itemPath = `${path}[${index}]`;
    if (isSkipValue(value)) throw new GassmaSkipInArrayError(itemPath);
    if (value === undefined && strict)
      throw new GassmaUndefinedValueError(itemPath);
    return normalizeValue(value, strict, itemPath);
  });

const normalizeDict = (
  dict: Record<string, unknown>,
  strict: boolean,
  path: string,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.keys(dict).forEach((key) => {
    const value = dict[key];
    if (isSkipValue(value)) return;
    const valuePath = joinPath(path, key);
    if (value === undefined && strict)
      throw new GassmaUndefinedValueError(valuePath);
    result[key] = normalizeValue(value, strict, valuePath);
  });
  return result;
};

const normalizeValue = (
  value: unknown,
  strict: boolean,
  path: string,
): unknown => {
  if (Array.isArray(value)) return normalizeArray(value, strict, path);
  if (isDict(value)) return normalizeDict(value, strict, path);
  return value;
};

function normalizeQueryInput<T>(input: T, strict: boolean): T;
function normalizeQueryInput(input: unknown, strict: boolean): unknown {
  return normalizeValue(input, strict, "");
}

export { normalizeQueryInput };
