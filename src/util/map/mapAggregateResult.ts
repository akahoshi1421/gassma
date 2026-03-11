import type { FieldMapping } from "./mapFields";
import { mapFromSheet } from "./mapFields";

const AGGREGATE_KEYS = ["_sum", "_count", "_avg", "_min", "_max"];

const mapAggregateResult = (
  data: Record<string, unknown>,
  mapping: FieldMapping,
): Record<string, unknown> => {
  const result = mapFromSheet(data, mapping);

  AGGREGATE_KEYS.forEach((key) => {
    if (key in result && result[key] !== undefined && result[key] !== null) {
      result[key] = mapFromSheet(
        result[key] as Record<string, unknown>,
        mapping,
      );
    }
  });

  return result;
};

export { mapAggregateResult };
