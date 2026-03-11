import type { FieldMapping } from "./mapFields";
import { mapToSheet } from "./mapFields";

const mapOrderByToSheet = (
  orderBy: Record<string, unknown> | Record<string, unknown>[] | undefined,
  mapping: FieldMapping,
): Record<string, unknown> | Record<string, unknown>[] | undefined => {
  if (!orderBy) return undefined;
  if (Array.isArray(orderBy)) {
    return orderBy.map((o) => mapToSheet(o, mapping));
  }
  return mapToSheet(orderBy, mapping);
};

const mapCursorToSheet = (
  cursor: Record<string, unknown> | undefined,
  mapping: FieldMapping,
): Record<string, unknown> | undefined => {
  if (!cursor) return undefined;
  return mapToSheet(cursor, mapping);
};

const mapDistinctToSheet = (
  distinct: string | string[] | undefined,
  mapping: FieldMapping,
): string | string[] | undefined => {
  if (!distinct) return undefined;
  if (Array.isArray(distinct)) {
    return distinct.map((d) => mapping[d] ?? d);
  }
  return mapping[distinct] ?? distinct;
};

export { mapOrderByToSheet, mapCursorToSheet, mapDistinctToSheet };
