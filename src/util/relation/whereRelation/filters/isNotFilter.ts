import type { RelationDefinition } from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
import { collectKeys } from "../../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const applyIsNotFilter = (
  relation: RelationDefinition,
  _relationName: string,
  filterWhere: WhereUse | null,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  if (filterWhere === null) {
    return { [relation.field]: { not: null } };
  }

  const targets = findManyOnSheet(relation.to, { where: filterWhere });
  const targetKeys = collectKeys(targets, relation.reference);
  return { [relation.field]: { notIn: targetKeys } };
};

export { applyIsNotFilter };
