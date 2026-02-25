import type { RelationDefinition } from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
import { collectKeys } from "../../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const applyIsFilter = (
  relation: RelationDefinition,
  _relationName: string,
  filterWhere: WhereUse | null,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  if (filterWhere === null) {
    return { [relation.field]: null };
  }

  const targets = findManyOnSheet(relation.to, { where: filterWhere });
  const targetKeys = collectKeys(targets, relation.reference);
  return { [relation.field]: { in: targetKeys } };
};

export { applyIsFilter };
