import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
import { NESTED_WRITE_KEYS } from "../create/nestedWrite/extractRelationData";
import { isDateValue } from "../other/isDateValue";
import { isDict } from "../other/isDict";
import { isRawValue } from "../raw/raw";
import {
  UPDATE_NESTED_WRITE_KEYS,
  isUpdateNestedWriteOperation,
} from "../update/nestedWrite/extractRelationDataForUpdate";
import {
  NUMBER_OPERATION_KEYS,
  isNumberOperation,
} from "../update/resolveNumberOperation";

const CONNECT_OR_CREATE_KEYS = ["where", "create"];

const isPlainObjectValue = (value: unknown): value is Record<string, unknown> =>
  isDict(value) && !isDateValue(value) && !isRawValue(value);

const assertKnownKeys = (
  value: Record<string, unknown>,
  allowed: string[],
): void => {
  Object.keys(value).forEach((key) => {
    if (!allowed.includes(key)) {
      throw new GassmaUnknownArgumentError(key, allowed);
    }
  });
};

const validateConnectOrCreateItems = (
  operation: Record<string, unknown>,
): void => {
  if (!("connectOrCreate" in operation)) return;
  const rawItems = operation.connectOrCreate;
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  items.forEach((item) => {
    if (!isPlainObjectValue(item)) return;
    assertKnownKeys(item, CONNECT_OR_CREATE_KEYS);
  });
};

const validateRelationOperation = (
  operation: Record<string, unknown>,
  allowed: string[],
): void => {
  assertKnownKeys(operation, allowed);
  validateConnectOrCreateItems(operation);
};

const validateCreateRow = (
  row: Record<string, unknown>,
  relationNames: string[],
): void => {
  Object.entries(row).forEach(([key, value]) => {
    if (!isPlainObjectValue(value)) return;
    if (!relationNames.includes(key)) return;
    validateRelationOperation(value, NESTED_WRITE_KEYS);
  });
};

const validateCreateDataOperations = (
  data: unknown,
  relationNames: string[],
): void => {
  if (Array.isArray(data)) {
    data.forEach((row) => {
      if (!isPlainObjectValue(row)) return;
      validateCreateRow(row, relationNames);
    });
    return;
  }
  if (!isPlainObjectValue(data)) return;
  validateCreateRow(data, relationNames);
};

const validateUpdateDataOperations = (
  data: unknown,
  relationNames: string[],
): void => {
  if (!isPlainObjectValue(data)) return;
  Object.entries(data).forEach(([key, value]) => {
    if (!isPlainObjectValue(value)) return;
    if (relationNames.includes(key)) {
      if (isNumberOperation(value)) return;
      validateRelationOperation(value, UPDATE_NESTED_WRITE_KEYS);
      return;
    }
    if (isUpdateNestedWriteOperation(value)) return;
    assertKnownKeys(value, NUMBER_OPERATION_KEYS);
  });
};

export { validateCreateDataOperations, validateUpdateDataOperations };
