import type { WhereUse } from "../../types/coreTypes";
import type {
  IncludeData,
  RelationContext,
  RelationDefinition,
} from "../../types/relationTypes";
import { GassmaThroughRequiredError } from "../../errors/relation/relationError";
import { collectKeys } from "./collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse; include?: IncludeData },
) => Record<string, unknown>[];

const countByRelation = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  findManyOnSheet: FindManyOnSheet,
  filterWhere?: WhereUse,
): Map<unknown, number> => {
  switch (relation.type) {
    case "oneToMany":
    case "oneToOne":
      return countOneToManyOrOne(
        parents,
        relation,
        findManyOnSheet,
        filterWhere,
      );
    case "manyToOne":
      return countManyToOne(parents, relation, findManyOnSheet, filterWhere);
    case "manyToMany":
      return countManyToMany(parents, relation, findManyOnSheet, filterWhere);
    default:
      return new Map();
  }
};

const countOneToManyOrOne = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  findManyOnSheet: FindManyOnSheet,
  filterWhere?: WhereUse,
): Map<unknown, number> => {
  const sourceKeys = collectKeys(parents, relation.field);
  const baseWhere: WhereUse = { [relation.reference]: { in: sourceKeys } };
  const where: WhereUse = filterWhere
    ? { AND: [baseWhere, filterWhere] }
    : baseWhere;

  const children = findManyOnSheet(relation.to, { where });

  const countMap = new Map<unknown, number>();
  children.forEach((child) => {
    const key = child[relation.reference];
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  });

  return countMap;
};

const countManyToOne = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  findManyOnSheet: FindManyOnSheet,
  filterWhere?: WhereUse,
): Map<unknown, number> => {
  const fkValues = collectKeys(parents, relation.field);
  if (fkValues.length === 0) return new Map();

  const baseWhere: WhereUse = { [relation.reference]: { in: fkValues } };
  const where: WhereUse = filterWhere
    ? { AND: [baseWhere, filterWhere] }
    : baseWhere;

  const targets = findManyOnSheet(relation.to, { where });

  const existsSet = new Set<unknown>();
  targets.forEach((t) => {
    existsSet.add(t[relation.reference]);
  });

  const countMap = new Map<unknown, number>();
  fkValues.forEach((fk) => {
    countMap.set(fk, existsSet.has(fk) ? 1 : 0);
  });

  return countMap;
};

const countManyToMany = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  findManyOnSheet: FindManyOnSheet,
  filterWhere?: WhereUse,
): Map<unknown, number> => {
  if (!relation.through) {
    throw new GassmaThroughRequiredError("_count");
  }

  const through = relation.through;
  const sourceKeys = collectKeys(parents, relation.field);

  const junctionRows = findManyOnSheet(through.sheet, {
    where: { [through.field]: { in: sourceKeys } },
  });

  if (junctionRows.length === 0) return new Map();

  if (!filterWhere) {
    const countMap = new Map<unknown, number>();
    junctionRows.forEach((jRow) => {
      const parentKey = jRow[through.field];
      countMap.set(parentKey, (countMap.get(parentKey) ?? 0) + 1);
    });
    return countMap;
  }

  const targetKeys = collectKeys(junctionRows, through.reference);
  const baseWhere: WhereUse = { [relation.reference]: { in: targetKeys } };
  const where: WhereUse = { AND: [baseWhere, filterWhere] };
  const targets = findManyOnSheet(relation.to, { where });

  const validTargetKeys = new Set<unknown>();
  targets.forEach((t) => {
    validTargetKeys.add(t[relation.reference]);
  });

  const countMap = new Map<unknown, number>();
  junctionRows.forEach((jRow) => {
    if (!validTargetKeys.has(jRow[through.reference])) return;
    const parentKey = jRow[through.field];
    countMap.set(parentKey, (countMap.get(parentKey) ?? 0) + 1);
  });

  return countMap;
};

const isCountSelect = (
  value: unknown,
): value is { select: Record<string, unknown> } => {
  return typeof value === "object" && value !== null && "select" in value;
};

const resolveCount = (
  parents: Record<string, unknown>[],
  countValue: unknown,
  context: RelationContext,
): Record<string, unknown>[] => {
  if (parents.length === 0) return [];

  const countTargets: { [name: string]: WhereUse | undefined } = {};

  if (countValue === true) {
    Object.keys(context.relations).forEach((name) => {
      countTargets[name] = undefined;
    });
  } else if (isCountSelect(countValue)) {
    Object.entries(countValue.select).forEach(([name, item]) => {
      if (item === true) {
        countTargets[name] = undefined;
      } else if (typeof item === "object" && item !== null) {
        countTargets[name] = (item as { where?: WhereUse }).where;
      }
    });
  }

  const countResults: Record<string, number>[] = parents.map(() => ({}));

  Object.keys(countTargets).forEach((relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;

    const countMap = countByRelation(
      parents,
      relation,
      context.findManyOnSheet,
      countTargets[relationName],
    );

    parents.forEach((parent, index) => {
      const key = parent[relation.field];
      countResults[index][relationName] = countMap.get(key) ?? 0;
    });
  });

  return parents.map((parent, index) => ({
    ...parent,
    _count: countResults[index],
  }));
};

export { resolveCount, countByRelation };
