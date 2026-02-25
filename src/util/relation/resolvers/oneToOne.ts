import type {
  IncludeItemOptions,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { GassmaRelationDuplicateError } from "../../../errors/relation/relationError";
import { collectKeys } from "../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const resolveOneToOne = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  relationName: string,
  findManyOnSheet: FindManyOnSheet,
  options?: IncludeItemOptions,
): Record<string, unknown>[] => {
  if (parents.length === 0) return [];

  const sourceKeys = collectKeys(parents, relation.field);
  const baseWhere: WhereUse = { [relation.reference]: { in: sourceKeys } };

  const where: WhereUse = options?.where
    ? { AND: [baseWhere, options.where] }
    : baseWhere;

  const children = findManyOnSheet(relation.to, { where });

  const lookup = new Map<unknown, Record<string, unknown>>();
  children.forEach((child) => {
    const key = child[relation.reference];
    if (lookup.has(key)) {
      throw new GassmaRelationDuplicateError(
        relation.to,
        relation.reference,
        key,
      );
    }
    lookup.set(key, child);
  });

  return parents.map((parent) => {
    const child = lookup.get(parent[relation.field]) ?? null;
    return { ...parent, [relationName]: child };
  });
};

export { resolveOneToOne };
