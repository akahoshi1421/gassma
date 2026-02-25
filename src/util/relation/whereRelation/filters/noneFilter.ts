import type { RelationDefinition } from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
import { collectKeys } from "../../collectKeys";
import { resolveManyToManyParentKeys } from "./manyToManyHelper";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const applyNoneFilter = (
  relation: RelationDefinition,
  _relationName: string,
  filterWhere: WhereUse,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  if (relation.type === "manyToMany") {
    const parentKeys = resolveManyToManyParentKeys(
      relation,
      filterWhere,
      findManyOnSheet,
    );
    return { [relation.field]: { notIn: parentKeys } };
  }

  const children = findManyOnSheet(relation.to, { where: filterWhere });
  const parentKeys = collectKeys(children, relation.reference);
  return { [relation.field]: { notIn: parentKeys } };
};

export { applyNoneFilter };
