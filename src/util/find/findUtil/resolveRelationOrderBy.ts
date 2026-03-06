import type { OrderBy } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import {
  RelationOrderByUnsupportedTypeError,
  RelationOrderByCountUnsupportedTypeError,
} from "../../../errors/find/findError";
import { collectKeys } from "../../relation/collectKeys";
import { countByRelation } from "../../relation/resolveCount";
import { isRelationOrderByValue } from "./separateRelationOrderBy";
import { orderByFunc } from "./orderBy";

const TEMP_KEY_PREFIX = "__gassma_rel__";

const buildTempKey = (relationName: string, field: string): string =>
  `${TEMP_KEY_PREFIX}${relationName}__${field}`;

const isCountSort = (relValue: Record<string, "asc" | "desc">): boolean =>
  Object.keys(relValue)[0] === "_count";

const resolveCountOrderBy = (
  records: Record<string, unknown>[],
  relationName: string,
  context: RelationContext,
): string => {
  const relationDef = context.relations[relationName];

  if (relationDef.type === "manyToOne") {
    throw new RelationOrderByCountUnsupportedTypeError(
      relationName,
      relationDef.type,
    );
  }

  const tempKey = buildTempKey(relationName, "_count");

  const countMap = countByRelation(
    records,
    relationDef,
    context.findManyOnSheet,
  );

  records.forEach((r) => {
    const key = r[relationDef.field];
    r[tempKey] = countMap.get(key) ?? 0;
  });

  return tempKey;
};

const resolveFieldOrderBy = (
  records: Record<string, unknown>[],
  relationName: string,
  sortField: string,
  context: RelationContext,
): string => {
  const relationDef = context.relations[relationName];

  if (relationDef.type !== "manyToOne" && relationDef.type !== "oneToOne") {
    throw new RelationOrderByUnsupportedTypeError(
      relationName,
      relationDef.type,
    );
  }

  const tempKey = buildTempKey(relationName, sortField);

  const fkValues = collectKeys(records, relationDef.field);

  if (fkValues.length === 0) {
    records.forEach((r) => {
      r[tempKey] = null;
    });
    return tempKey;
  }

  const relatedRecords = context.findManyOnSheet(relationDef.to, {
    where: { [relationDef.reference]: { in: fkValues } },
  });

  const lookup = new Map<unknown, unknown>();
  relatedRecords.forEach((r) => {
    lookup.set(r[relationDef.reference], r[sortField]);
  });

  records.forEach((r) => {
    const fk = r[relationDef.field];
    r[tempKey] =
      fk === null || fk === undefined ? null : (lookup.get(fk) ?? null);
  });

  return tempKey;
};

const resolveRelationOrderBy = (
  records: Record<string, unknown>[],
  orderByArr: OrderBy[],
  context: RelationContext,
): Record<string, unknown>[] => {
  if (records.length === 0) return records;

  const tempKeys: string[] = [];

  orderByArr.forEach((entry) => {
    const [key, value] = Object.entries(entry)[0];
    if (!isRelationOrderByValue(value)) return;

    const relValue = value as Record<string, "asc" | "desc">;

    const tempKey = isCountSort(relValue)
      ? resolveCountOrderBy(records, key, context)
      : resolveFieldOrderBy(records, key, Object.keys(relValue)[0], context);

    tempKeys.push(tempKey);
  });

  const resolvedOrderBy: OrderBy[] = orderByArr.map((entry) => {
    const [key, value] = Object.entries(entry)[0];
    if (!isRelationOrderByValue(value)) return entry;

    const relValue = value as Record<string, "asc" | "desc">;
    const [sortField, sortDir] = Object.entries(relValue)[0];
    const tempKey = buildTempKey(key, sortField);
    return { [tempKey]: sortDir };
  });

  const sorted = orderByFunc(records, resolvedOrderBy);

  sorted.forEach((r) => {
    tempKeys.forEach((tk) => {
      delete r[tk];
    });
  });

  return sorted;
};

export { resolveRelationOrderBy };
