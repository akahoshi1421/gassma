import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { WhereRelationWithoutContextError } from "../../../errors/relation/whereRelationError";
import { isDict } from "../../other/isDict";
import {
  dispatchFilter,
  isFilterKey,
  validateFilterType,
} from "./filters/dispatchFilter";
import { applyNullShorthand } from "./filters/nullShorthandFilter";

const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);

const toDict = (value: unknown): Record<string, unknown> | null => {
  if (isDict(value)) return value as Record<string, unknown>;
  return null;
};

const isRelationFilter = (
  key: string,
  value: unknown,
  relations: { [name: string]: RelationDefinition },
): boolean => {
  if (!(key in relations)) return false;
  const dict = toDict(value);
  if (!dict) return false;
  return Object.keys(dict).some(isFilterKey);
};

const resolveWhereRelation = (
  where: WhereUse,
  context: RelationContext | null,
): WhereUse => {
  if (!context) {
    const hasRelation = Object.entries(where).some(([, value]) => {
      const dict = toDict(value);
      return dict !== null && Object.keys(dict).some(isFilterKey);
    });
    if (hasRelation) throw new WhereRelationWithoutContextError();
    return where;
  }

  const normalConditions: WhereUse = {};
  const relationConditions: WhereUse[] = [];

  Object.entries(where).forEach(([key, value]) => {
    if (LOGICAL_KEYS.has(key)) return;

    if (value === null && key in context.relations) {
      const resolved = applyNullShorthand(
        context.relations[key],
        key,
        context.findManyOnSheet,
      );
      relationConditions.push(resolved);
      return;
    }

    if (!isRelationFilter(key, value, context.relations)) {
      normalConditions[key] = value;
      return;
    }

    const relation = context.relations[key];
    const filterObj = toDict(value)!;

    Object.entries(filterObj).forEach(([filterKey, filterValue]) => {
      validateFilterType(relation, key, filterKey);
      const resolved = dispatchFilter(
        relation,
        key,
        filterKey,
        filterValue === null ? null : (filterValue as WhereUse),
        context.findManyOnSheet,
      );
      relationConditions.push(resolved);
    });
  });

  let logicalChanged = false;
  LOGICAL_KEYS.forEach((logicalKey) => {
    if (!(logicalKey in where)) return;
    const val = where[logicalKey];

    if (Array.isArray(val)) {
      const resolved = val.map((item) =>
        resolveWhereRelation(item as WhereUse, context),
      );
      normalConditions[logicalKey] = resolved;
      if (resolved.some((r, i) => r !== val[i])) logicalChanged = true;
    } else {
      const dict = toDict(val);
      if (dict) {
        const resolved = resolveWhereRelation(dict as WhereUse, context);
        normalConditions[logicalKey] = resolved;
        if (resolved !== val) logicalChanged = true;
      } else {
        normalConditions[logicalKey] = val;
      }
    }
  });

  if (relationConditions.length === 0 && !logicalChanged) return where;
  if (relationConditions.length === 0) return normalConditions;

  const allConditions: WhereUse[] = [];
  if (Object.keys(normalConditions).length > 0) {
    allConditions.push(normalConditions);
  }
  allConditions.push(...relationConditions);

  return { AND: allConditions };
};

export { resolveWhereRelation };
