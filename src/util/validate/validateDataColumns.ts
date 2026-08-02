import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../errors/argument/argumentError";
import type { WhereValidation } from "../../types/gassmaControllerUtilType";
import { NESTED_WRITE_KEYS } from "../create/nestedWrite/extractRelationData";
import { isDateValue } from "../other/isDateValue";
import { isDict } from "../other/isDict";
import { isRawValue } from "../raw/raw";
import { UPDATE_NESTED_WRITE_KEYS } from "../update/nestedWrite/extractRelationDataForUpdate";
import { NUMBER_OPERATION_KEYS } from "../update/resolveNumberOperation";

type DataColumnMode = "create" | "createMany" | "update" | "updateMany";

const RELATION_OPERATION_KEYS: Record<DataColumnMode, string[] | null> = {
  create: NESTED_WRITE_KEYS,
  createMany: null,
  update: UPDATE_NESTED_WRITE_KEYS,
  updateMany: null,
};

const isPlainObjectValue = (value: unknown): value is Record<string, unknown> =>
  isDict(value) && !isDateValue(value) && !isRawValue(value);

const validateColumnOperations = (
  value: unknown,
  mode: DataColumnMode,
): void => {
  if (mode !== "update" && mode !== "updateMany") return;
  if (!isPlainObjectValue(value)) return;
  Object.keys(value).forEach((operationKey) => {
    if (!NUMBER_OPERATION_KEYS.includes(operationKey)) {
      throw new GassmaUnknownArgumentError(operationKey, NUMBER_OPERATION_KEYS);
    }
  });
};

const validateDataColumns = (
  data: Record<string, unknown>,
  titles: string[],
  validation: WhereValidation,
  mode: DataColumnMode,
): void => {
  const allowedColumns = titles.filter(
    (title) => !validation.ignoredFields.includes(title),
  );
  const allowed = new Set(allowedColumns);
  const relationOperationKeys = RELATION_OPERATION_KEYS[mode];

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (allowed.has(key)) {
      validateColumnOperations(value, mode);
      return;
    }
    if (
      relationOperationKeys !== null &&
      validation.relationNames.includes(key)
    ) {
      throw new GassmaInvalidValueError(
        key,
        `a nested write operation object with one of: ${relationOperationKeys.join(", ")}`,
      );
    }
    const availableArguments =
      relationOperationKeys === null
        ? allowedColumns
        : [...allowedColumns, ...validation.relationNames];
    throw new GassmaUnknownArgumentError(key, availableArguments);
  });
};

export { validateDataColumns };
export type { DataColumnMode };
