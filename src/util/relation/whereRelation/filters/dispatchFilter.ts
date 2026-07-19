import type { RelationDefinition } from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
import { WhereRelationInvalidFilterError } from "../../../../errors/relation/whereRelationError";
import { applySomeFilter } from "./someFilter";
import { applyNoneFilter } from "./noneFilter";
import { applyEveryFilter } from "./everyFilter";
import { applyIsFilter } from "./isFilter";
import { applyIsNotFilter } from "./isNotFilter";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const LIST_FILTER_SET = new Set(["some", "every", "none"]);
const SINGLE_FILTER_SET = new Set(["is", "isNot"]);
const LIST_RELATION_TYPES = new Set(["oneToMany", "manyToMany"]);
const SINGLE_RELATION_TYPES = new Set(["oneToOne", "manyToOne"]);

const isFilterKey = (k: string): boolean =>
  LIST_FILTER_SET.has(k) || SINGLE_FILTER_SET.has(k);

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

export { isFilterKey, validateFilterType, dispatchFilter };
