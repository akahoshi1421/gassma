import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { isDict } from "../other/isDict";
import { isRawValue } from "../raw/raw";
import { validateWritableValue } from "./validateWritableValue";

const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);
const LIST_OPERATOR_KEYS = new Set(["in", "notIn"]);

const validateQueryScalar = (key: string, value: unknown): void => {
  if (isRawValue(value)) {
    throw new GassmaInvalidValueError(
      key,
      "a scalar value, but received a Gassma.raw value",
    );
  }
  validateWritableValue(key, value);
};

const walkOperators = (conditions: Record<string, unknown>): void => {
  Object.entries(conditions).forEach(([key, value]) => {
    if (value === undefined) return;
    if (LIST_OPERATOR_KEYS.has(key) && Array.isArray(value)) {
      value.forEach((item) => {
        validateQueryScalar(key, item);
      });
      return;
    }
    if (isDict(value)) {
      walkOperators(value);
      return;
    }
    validateQueryScalar(key, value);
  });
};

const validateQueryValues = (where: Record<string, unknown>): void => {
  Object.entries(where).forEach(([key, value]) => {
    if (value === undefined) return;
    if (LOGICAL_KEYS.has(key)) {
      const branches = Array.isArray(value) ? value : [value];
      branches.forEach((branch) => {
        if (isDict(branch)) validateQueryValues(branch);
      });
      return;
    }
    if (isDict(value)) {
      walkOperators(value);
      return;
    }
    validateQueryScalar(key, value);
  });
};

export { validateQueryScalar, validateQueryValues };
