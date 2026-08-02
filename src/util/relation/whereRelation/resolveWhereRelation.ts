import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { WhereRelationWithoutContextError } from "../../../errors/relation/whereRelationError";
import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { isDict } from "../../other/isDict";
import {
  LIST_FILTER_KEYS,
  dispatchFilter,
  isFilterKey,
  isListRelationType,
  validateFilterType,
} from "./filters/dispatchFilter";
import { applyNullShorthand } from "./filters/nullShorthandFilter";

const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);

const toDict = (value: unknown): Record<string, unknown> | null => {
  if (isDict(value)) return value as Record<string, unknown>;
  return null;
};

const toRelationFilter = (
  relation: RelationDefinition,
  relationName: string,
  value: unknown,
): Record<string, unknown> => {
  const dict = toDict(value);
  if (!dict) {
    throw new GassmaInvalidValueError(
      relationName,
      "a relation filter object or null",
    );
  }
  if (Object.keys(dict).some(isFilterKey)) return dict;
  if (!isListRelationType(relation.type)) return { is: dict };

  const firstKey = Object.keys(dict)[0];
  if (firstKey === undefined) {
    throw new GassmaInvalidValueError(
      relationName,
      "an object with `some`, `every`, or `none`",
    );
  }
  throw new GassmaUnknownArgumentError(firstKey, LIST_FILTER_KEYS);
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

    if (!(key in context.relations)) {
      normalConditions[key] = value;
      return;
    }

    if (value === undefined) return;

    const relation = context.relations[key];

    if (value === null) {
      const resolved = applyNullShorthand(
        relation,
        key,
        context.findManyOnSheet,
      );
      relationConditions.push(resolved);
      return;
    }

    const filterObj = toRelationFilter(relation, key, value);

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
