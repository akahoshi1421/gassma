import type {
  IncludeData,
  IncludeItemOptions,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { GassmaSkipNegativeError } from "../../../errors/find/findError";
import { orderByFunc } from "../../find/findUtil/orderBy";
import { applySelectOmit } from "../../find/findUtil/applySelectOmit";
import { applySelectRelations } from "../../find/findUtil/applySelectRelations";
import { collectKeys } from "../collectKeys";
import { processSelectForInclude } from "../processSelectForInclude";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse; include?: IncludeData },
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

  const grouped = new Map<unknown, Record<string, unknown>[]>();
  children.forEach((child) => {
    const key = child[relation.reference];
    const list = grouped.get(key) ?? [];
    list.push(child);
    grouped.set(key, list);
  });

  return parents.map((parent) => {
    let items = grouped.get(parent[relation.field]) ?? [];

    if (options?.orderBy) {
      const orderByArr = Array.isArray(options.orderBy)
        ? options.orderBy
        : [options.orderBy];
      items = orderByFunc([...items], orderByArr);
    }

    if (options?.skip !== undefined && options.skip < 0) {
      throw new GassmaSkipNegativeError(options.skip);
    }

    if (options?.take !== undefined) {
      if (options.take === 0) {
        items = [];
      } else if (options.take > 0) {
        if (options?.skip !== undefined) items = items.slice(options.skip);
        items = items.slice(0, options.take);
      } else {
        if (options?.skip !== undefined) items = items.slice(0, -options.skip);
        items = items.slice(options.take);
      }
    } else if (options?.skip !== undefined) {
      items = items.slice(options.skip);
    }

    if (processed?.nestedInclude) {
      const nestedKeys = Object.keys(processed.nestedInclude);
      const filtered = applySelectRelations(
        items,
        processed.scalarSelect,
        nestedKeys,
      );
      return { ...parent, [relationName]: filtered };
    }

    const filtered = applySelectOmit(items, options?.select, options?.omit);
    return { ...parent, [relationName]: filtered };
  });
};

export { resolveOneToMany };
