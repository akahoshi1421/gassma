import type { OrderBy } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import { RelationOrderByUnsupportedTypeError } from "../../../errors/find/findError";
import { collectKeys } from "../../relation/collectKeys";
import { isRelationOrderByValue } from "./separateRelationOrderBy";
import { orderByFunc } from "./orderBy";

const TEMP_KEY_PREFIX = "__gassma_rel__";

const buildTempKey = (relationName: string, field: string): string =>
  `${TEMP_KEY_PREFIX}${relationName}__${field}`;

const resolveRelationOrderBy = (
  records: Record<string, unknown>[],
  orderByArr: OrderBy[],
  context: RelationContext,
): Record<string, unknown>[] => {
  if (records.length === 0) return records;

  const tempKeys: string[] = [];

  // Process each relation orderBy entry: fetch data and map temp keys
  orderByArr.forEach((entry) => {
    const [key, value] = Object.entries(entry)[0];
    if (!isRelationOrderByValue(value)) return;

    const relationDef = context.relations[key];
    if (relationDef.type !== "manyToOne" && relationDef.type !== "oneToOne") {
      throw new RelationOrderByUnsupportedTypeError(key, relationDef.type);
    }

    const relValue = value as Record<string, "asc" | "desc">;
    const [sortField] = Object.keys(relValue);
    const tempKey = buildTempKey(key, sortField);
    tempKeys.push(tempKey);

    // Collect FK values from parent records
    const fkValues = collectKeys(records, relationDef.field);

    if (fkValues.length === 0) {
      // All FKs are null - set all temp keys to null
      records.forEach((r) => {
        r[tempKey] = null;
      });
      return;
    }

    // Fetch related data
    const relatedRecords = context.findManyOnSheet(relationDef.to, {
      where: { [relationDef.reference]: { in: fkValues } },
    });

    // Build lookup: reference value -> sort field value
    const lookup = new Map<unknown, unknown>();
    relatedRecords.forEach((r) => {
      lookup.set(r[relationDef.reference], r[sortField]);
    });

    // Map temp key onto parent records
    records.forEach((r) => {
      const fk = r[relationDef.field];
      r[tempKey] =
        fk === null || fk === undefined ? null : (lookup.get(fk) ?? null);
    });
  });

  // Replace relation orderBy entries with temp key entries for sorting
  const resolvedOrderBy: OrderBy[] = orderByArr.map((entry) => {
    const [key, value] = Object.entries(entry)[0];
    if (!isRelationOrderByValue(value)) return entry;

    const relValue = value as Record<string, "asc" | "desc">;
    const [sortField, sortDir] = Object.entries(relValue)[0];
    const tempKey = buildTempKey(key, sortField);
    return { [tempKey]: sortDir };
  });

  // Sort using the unified orderBy
  const sorted = orderByFunc(records, resolvedOrderBy);

  // Remove temp keys
  sorted.forEach((r) => {
    tempKeys.forEach((tk) => {
      delete r[tk];
    });
  });

  return sorted;
};

export { resolveRelationOrderBy };
