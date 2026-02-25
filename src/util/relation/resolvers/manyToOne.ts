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

const resolveManyToOne = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  relationName: string,
  findManyOnSheet: FindManyOnSheet,
  options?: IncludeItemOptions,
): Record<string, unknown>[] => {
  if (parents.length === 0) return [];

  const fkValues = collectKeys(parents, relation.field);
  const baseWhere: WhereUse = { [relation.reference]: { in: fkValues } };

  const where: WhereUse = options?.where
    ? { AND: [baseWhere, options.where] }
    : baseWhere;

  const targets = findManyOnSheet(relation.to, { where });

  const lookup = new Map<unknown, Record<string, unknown>>();
  targets.forEach((target) => {
    const key = target[relation.reference];
    if (lookup.has(key)) {
      throw new GassmaRelationDuplicateError(
        relation.to,
        relation.reference,
        key,
      );
    }
    lookup.set(key, target);
  });

  return parents.map((parent) => {
    const fk = parent[relation.field];
    const target =
      fk !== null && fk !== undefined ? (lookup.get(fk) ?? null) : null;
    return { ...parent, [relationName]: target };
  });
};

export { resolveManyToOne };
