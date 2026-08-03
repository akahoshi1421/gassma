import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
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
  validateFieldKeys(Object.keys(cursor), titles);
  Object.entries(cursor).forEach(([key, value]) => {
    if (value === undefined) return;
    validateQueryScalar(key, value);
  });
};

export { validateCursorKeys, validateDistinctKeys };
