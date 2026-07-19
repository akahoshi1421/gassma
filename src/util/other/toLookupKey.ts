import { isDateValue } from "./isDateValue";

const toLookupKey = (value: unknown): unknown => {
  if (isDateValue(value)) return `date:${value.getTime()}`;
  if (typeof value === "string") return `str:${value}`;
  return value;
};

export { toLookupKey };
