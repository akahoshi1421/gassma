import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import {
  WhereRelationInvalidFilterError,
  WhereRelationWithoutContextError,
} from "../../../errors/relation/whereRelationError";
import { isDict } from "../../other/isDict";
import { applySomeFilter } from "./filters/someFilter";
import { applyNoneFilter } from "./filters/noneFilter";
import { applyEveryFilter } from "./filters/everyFilter";
import { applyIsFilter } from "./filters/isFilter";
import { applyIsNotFilter } from "./filters/isNotFilter";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const LIST_FILTER_SET = new Set(["some", "every", "none"]);
const SINGLE_FILTER_SET = new Set(["is", "isNot"]);
const LIST_RELATION_TYPES = new Set(["oneToMany", "manyToMany"]);
const SINGLE_RELATION_TYPES = new Set(["oneToOne", "manyToOne"]);
const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);

const isFilterKey = (k: string): boolean =>
  LIST_FILTER_SET.has(k) || SINGLE_FILTER_SET.has(k);

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

const dispatchFilter = (
  relation: RelationDefinition,
  relationName: string,
  filterKey: string,
  filterValue: WhereUse | null,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  if (filterKey === "some") {
    return applySomeFilter(
      relation,
      relationName,
      filterValue!,
      findManyOnSheet,
    );
  }
  if (filterKey === "every") {
    return applyEveryFilter(
      relation,
      relationName,
      filterValue!,
      findManyOnSheet,
    );
  }
  if (filterKey === "none") {
    return applyNoneFilter(
      relation,
      relationName,
      filterValue!,
      findManyOnSheet,
    );
  }
  if (filterKey === "is") {
    return applyIsFilter(relation, relationName, filterValue, findManyOnSheet);
  }
  if (filterKey === "isNot") {
    return applyIsNotFilter(
      relation,
      relationName,
      filterValue,
      findManyOnSheet,
    );
  }
  throw new WhereRelationInvalidFilterError(
    relationName,
    relation.type,
    filterKey,
  );
};

const validateFilterType = (
  relation: RelationDefinition,
  relationName: string,
  filterKey: string,
): void => {
  if (
    LIST_FILTER_SET.has(filterKey) &&
    !LIST_RELATION_TYPES.has(relation.type)
  ) {
    throw new WhereRelationInvalidFilterError(
      relationName,
      relation.type,
      filterKey,
    );
  }
  if (
    SINGLE_FILTER_SET.has(filterKey) &&
    !SINGLE_RELATION_TYPES.has(relation.type)
  ) {
    throw new WhereRelationInvalidFilterError(
      relationName,
      relation.type,
      filterKey,
    );
  }
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
