import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { isFieldRef } from "../filterConditions/fieldRef";
import { isDateValue } from "../other/isDateValue";
import { isRawValue } from "../raw/raw";

const describeObjectValue = (value: object): string => {
  const tag = Object.prototype.toString.call(value).slice(8, -1);
  if (tag === "Object") return "an object";
  // U は Uint8Array のように子音として読むタグしかないので除く
  const article = /^[AEIO]/.test(tag) ? "an" : "a";
  return `${article} ${tag}`;
};

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
  if (
    typeof value === "object" &&
    value !== null &&
    !isDateValue(value) &&
    !isRawValue(value) &&
    !isFieldRef(value)
  ) {
    throw new GassmaInvalidValueError(
      key,
      `a scalar value, but received ${describeObjectValue(value)}`,
    );
  }
};

export { validateWritableValue };
