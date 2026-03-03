import type { NumberOperation } from "../../types/coreTypes";

const NUMBER_OPERATION_KEYS = ["increment", "decrement", "multiply", "divide"];

const isNumberOperation = (value: unknown): value is NumberOperation =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).some((key) => NUMBER_OPERATION_KEYS.includes(key));

const resolveNumberOperation = (
  currentValue: unknown,
  operation: NumberOperation,
): number => {
  const base = typeof currentValue === "number" ? currentValue : 0;
  if (operation.increment !== undefined) return base + operation.increment;
  if (operation.decrement !== undefined) return base - operation.decrement;
  if (operation.multiply !== undefined) return base * operation.multiply;
  if (operation.divide !== undefined) return base / operation.divide;
  return base;
};

const resolveNumberOperations = (
  currentRecord: Record<string, unknown>,
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const resolved: Record<string, unknown> = { ...currentRecord };
  Object.entries(data).forEach(([key, value]) => {
    if (isNumberOperation(value)) {
      resolved[key] = resolveNumberOperation(currentRecord[key], value);
    } else {
      resolved[key] = value;
    }
  });
  return resolved;
};

export { isNumberOperation, resolveNumberOperation, resolveNumberOperations };
