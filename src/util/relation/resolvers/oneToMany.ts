import type {
  IncludeItemOptions,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { orderByFunc } from "../../find/findUtil/orderBy";
import { collectKeys } from "../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const resolveOneToMany = (
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

  const grouped = new Map<unknown, Record<string, unknown>[]>();
  for (const child of children) {
    const key = child[relation.reference];
    const list = grouped.get(key) ?? [];
    list.push(child);
    grouped.set(key, list);
  }

  return parents.map((parent) => {
    let items = grouped.get(parent[relation.field]) ?? [];

    if (options?.orderBy) {
      const orderByArr = Array.isArray(options.orderBy)
        ? options.orderBy
        : [options.orderBy];
      items = orderByFunc([...items], orderByArr);
    }

    if (options?.take !== undefined) {
      items = items.slice(0, options.take);
    }

    return { ...parent, [relationName]: items };
  });
};

export { resolveOneToMany };
