import type { FilterConditions, GassmaAny } from "../../types/coreTypes";
import { isFieldRef } from "./fieldRef";

const STRING_KEYS = new Set(["contains", "startsWith", "endsWith"]);

const hasAnyFieldRef = (opts: Record<string, unknown>): boolean =>
  Object.values(opts).some(isFieldRef);

const resolveFieldRefs = (
  filterOptions: FilterConditions,
  row: GassmaAny[],
  titles: GassmaAny[],
): FilterConditions => {
  if (!hasAnyFieldRef(filterOptions)) return filterOptions;

  const resolved: Record<string, unknown> = {};

  Object.keys(filterOptions).forEach((key) => {
    const val = filterOptions[key as keyof FilterConditions];
    if (!isFieldRef(val)) {
      resolved[key] = val;
      return;
    }
    const idx = titles.indexOf(val.name);
    if (idx === -1) {
      resolved[key] = undefined;
      return;
    }
    resolved[key] = STRING_KEYS.has(key) ? String(row[idx]) : row[idx];
  });

  return resolved as FilterConditions;
};

export { resolveFieldRefs };
