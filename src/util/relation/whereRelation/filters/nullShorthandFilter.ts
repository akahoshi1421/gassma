import type { RelationDefinition } from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
import { WhereRelationInvalidFilterError } from "../../../../errors/relation/whereRelationError";
import { applyIsFilter } from "./isFilter";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const applyNullShorthand = (
  relation: RelationDefinition,
  relationName: string,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  if (relation.type === "oneToMany" || relation.type === "manyToMany") {
    throw new WhereRelationInvalidFilterError(
      relationName,
      relation.type,
      "null",
    );
  }
  return applyIsFilter(relation, relationName, null, findManyOnSheet);
};

export { applyNullShorthand };
