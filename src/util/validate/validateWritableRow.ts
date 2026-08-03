import { validateWritableValue } from "./validateWritableValue";

const validateWritableRow = (row: Record<string, unknown>): void => {
  Object.entries(row).forEach(([key, value]) => {
    validateWritableValue(key, value);
  });
};

export { validateWritableRow };
