import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../errors/argument/argumentError";
import { validateQueryScalar } from "./validateQueryValues";

const validateFieldKeys = (keys: string[], titles: string[]): void => {
  keys.forEach((key) => {
    if (!titles.includes(key)) {
      throw new GassmaUnknownArgumentError(key, titles);
    }
  });
};

const validateDistinctKeys = (
  distinct: string | string[],
  titles: string[],
): void => {
  validateFieldKeys(Array.isArray(distinct) ? distinct : [distinct], titles);
};

const validateCursorKeys = (
  cursor: Record<string, unknown>,
  titles: string[],
): void => {
  // Prisma 実測(2026-08-03): 空の cursor はエラー("needs at least one of `id` arguments")
  if (Object.keys(cursor).length === 0) {
    throw new GassmaInvalidValueError("cursor", "at least one column");
  }
  validateFieldKeys(Object.keys(cursor), titles);
  Object.entries(cursor).forEach(([key, value]) => {
    if (value === undefined) return;
    validateQueryScalar(key, value);
  });
};

export { validateCursorKeys, validateDistinctKeys };
