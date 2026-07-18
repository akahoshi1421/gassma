import { isDateValue } from "./isDateValue";

const isValueEqual = (a: unknown, b: unknown): boolean => {
  if (isDateValue(a) && isDateValue(b)) {
    return a.getTime() === b.getTime();
  }
  return a === b;
};

const containsValue = (list: readonly unknown[], value: unknown): boolean =>
  list.includes(value) || list.some((item) => isValueEqual(item, value));

export { containsValue, isValueEqual };
