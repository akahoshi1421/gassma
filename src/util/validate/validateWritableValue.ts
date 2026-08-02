import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { isDateValue } from "../other/isDateValue";

const validateWritableValue = (key: string, value: unknown): void => {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new GassmaInvalidValueError(
      key,
      `a finite number, but received ${String(value)}`,
    );
  }
  if (isDateValue(value) && Number.isNaN(value.getTime())) {
    throw new GassmaInvalidValueError(
      key,
      "a valid Date, but the provided Date object is invalid",
    );
  }
  if (Array.isArray(value)) {
    throw new GassmaInvalidValueError(
      key,
      "a scalar value, but received an array",
    );
  }
  if (
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    throw new GassmaInvalidValueError(
      key,
      `a scalar value, but received a ${typeof value}`,
    );
  }
};

export { validateWritableValue };
