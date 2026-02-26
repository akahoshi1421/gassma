import type { RelationDefinition } from "../../../../types/relationTypes";
import type { GassmaAny, WhereUse } from "../../../../types/coreTypes";
import { GassmaThroughRequiredError } from "../../../../errors/relation/relationError";
import { collectKeys } from "../../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const resolveManyToManyParentKeys = (
  relation: RelationDefinition,
  filterWhere: WhereUse,
  findManyOnSheet: FindManyOnSheet,
): GassmaAny[] => {
  if (!relation.through) {
    throw new GassmaThroughRequiredError("unknown");
  }

  const through = relation.through;

  const targets = findManyOnSheet(relation.to, { where: filterWhere });
  if (targets.length === 0) return [];

  const targetKeys = collectKeys(targets, relation.reference);
  if (targetKeys.length === 0) return [];

  const junctionRows = findManyOnSheet(through.sheet, {
    where: { [through.reference]: { in: targetKeys } },
  });

  return collectKeys(junctionRows, through.field);
};

export { resolveManyToManyParentKeys };
