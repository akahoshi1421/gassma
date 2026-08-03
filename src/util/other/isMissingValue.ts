import { isDateValue } from "./isDateValue";

// null / undefined に加え、NaN / Invalid Date も欠損として扱う
const isMissingValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number" && Number.isNaN(value)) return true;
  return isDateValue(value) && Number.isNaN(value.getTime());
};

export { isMissingValue };
