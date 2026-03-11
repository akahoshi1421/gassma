import type { FieldMapping } from "./mapFields";
import { mapToSheet } from "./mapFields";

const mapByValue = (
  by: string | string[],
  mapping: FieldMapping,
): string | string[] => {
  if (Array.isArray(by)) {
    return by.map((key) => mapping[key] ?? key);
  }
  return mapping[by] ?? by;
};

const mapGroupByInput = (
  data: Record<string, unknown>,
  mapping: FieldMapping,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...data };

  if (result.by !== undefined) {
    result.by = mapByValue(result.by as string | string[], mapping);
  }

  const aggregateKeys = ["_sum", "_count", "_avg", "_min", "_max"];
  aggregateKeys.forEach((key) => {
    if (result[key] !== undefined) {
      result[key] = mapToSheet(result[key] as Record<string, unknown>, mapping);
    }
  });

  if (result.having !== undefined) {
    result.having = mapToSheet(
      result.having as Record<string, unknown>,
      mapping,
    );
  }

  return result;
};

export { mapGroupByInput };
