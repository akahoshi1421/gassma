import type {
  IncludeData,
  IncludeItemOptions,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { GassmaRelationDuplicateError } from "../../../errors/relation/relationError";
import { applySelectOmit } from "../../find/findUtil/applySelectOmit";
import { applySelectRelations } from "../../find/findUtil/applySelectRelations";
import { collectKeys } from "../collectKeys";
import { processSelectForInclude } from "../processSelectForInclude";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse; include?: IncludeData },
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

  const processed = options?.select
    ? processSelectForInclude(options.select)
    : null;
  const mergedInclude = processed?.nestedInclude
    ? { ...(options?.include ?? {}), ...processed.nestedInclude }
    : options?.include;

  const children = findManyOnSheet(relation.to, {
    where,
    include: mergedInclude,
  });

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
    if (!child) return { ...parent, [relationName]: null };

    if (processed?.nestedInclude) {
      const nestedKeys = Object.keys(processed.nestedInclude);
      const filtered = applySelectRelations(
        [child],
        processed.scalarSelect,
        nestedKeys,
      );
      return { ...parent, [relationName]: filtered[0] ?? null };
    }

    const filtered = applySelectOmit(
      [child],
      options?.select,
      options?.omit,
    )[0];
    return { ...parent, [relationName]: filtered };
  });
};

export { resolveOneToOne };
