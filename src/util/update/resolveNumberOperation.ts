import type { NumberOperation } from "../../types/coreTypes";
import { validateWritableValue } from "../validate/validateWritableValue";

const NUMBER_OPERATION_KEYS = ["increment", "decrement", "multiply", "divide"];

const isNumberOperation = (value: unknown): value is NumberOperation =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).some((key) => NUMBER_OPERATION_KEYS.includes(key));

const applyNumberOperation = (
  base: number,
  operation: NumberOperation,
): number => {
  if (operation.increment !== undefined) return base + operation.increment;
  if (operation.decrement !== undefined) return base - operation.decrement;
  if (operation.multiply !== undefined) return base * operation.multiply;
  if (operation.divide !== undefined) return base / operation.divide;
  return base;
};

const resolveNumberOperation = (
  currentValue: unknown,
  operation: NumberOperation,
  columnName: string,
): number => {
  const base = typeof currentValue === "number" ? currentValue : 0;
  const result = applyNumberOperation(base, operation);
  validateWritableValue(columnName, result);
  return result;
};

const resolveNumberOperations = (
  currentRecord: Record<string, unknown>,
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const resolved: Record<string, unknown> = { ...currentRecord };
  Object.entries(data).forEach(([key, value]) => {
    if (isNumberOperation(value)) {
      resolved[key] = resolveNumberOperation(currentRecord[key], value, key);
    } else {
      resolved[key] = value;
    }
  });
  return resolved;
};

export {
  NUMBER_OPERATION_KEYS,
  isNumberOperation,
  resolveNumberOperation,
  resolveNumberOperations,
};
