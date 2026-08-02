import { isDateValue } from "../../other/isDateValue";

// SQL の集計が NULL を無視するのに合わせ、NaN / Invalid Date も欠損として扱う
const isMissingAggregateValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number" && Number.isNaN(value)) return true;
  return isDateValue(value) && Number.isNaN(value.getTime());
};

export { isMissingAggregateValue };
