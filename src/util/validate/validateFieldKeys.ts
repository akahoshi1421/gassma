import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";

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
};

export { validateCursorKeys, validateDistinctKeys };
