import {
  IncludeInvalidOptionTypeError,
  IncludeSelectOmitConflictError,
} from "../../../errors/relation/relationValidationError";
import type { IncludeData } from "../../../types/relationTypes";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const validateOptionObject = (
  relationName: string,
  optionName: string,
  value: unknown,
): void => {
  if (value !== undefined && !isObject(value)) {
    throw new IncludeInvalidOptionTypeError(
      relationName,
      optionName,
      "an object",
    );
  }
};

const validateIncludeItem = (relationName: string, value: unknown): void => {
  if (value === true) return;

  if (!isObject(value)) {
    throw new IncludeInvalidOptionTypeError(
      relationName,
      "value",
      "true or an object",
    );
  }

  if (value.select !== undefined && value.omit !== undefined) {
    throw new IncludeSelectOmitConflictError(relationName);
  }

  if (value.take !== undefined && typeof value.take !== "number") {
    throw new IncludeInvalidOptionTypeError(relationName, "take", "a number");
  }

  validateOptionObject(relationName, "where", value.where);
  validateOptionObject(relationName, "orderBy", value.orderBy);
  validateOptionObject(relationName, "select", value.select);
  validateOptionObject(relationName, "omit", value.omit);
};

const validateIncludeOptions = (include: IncludeData): void => {
  Object.keys(include).forEach((relationName) => {
    validateIncludeItem(relationName, include[relationName]);
  });
};

export { validateIncludeOptions };
