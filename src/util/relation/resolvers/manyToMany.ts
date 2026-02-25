import type {
  IncludeItemOptions,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { GassmaThroughRequiredError } from "../../../errors/relation/relationError";
import { orderByFunc } from "../../find/findUtil/orderBy";
import { collectKeys } from "../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const resolveManyToMany = (
  parents: Record<string, unknown>[],
  relation: RelationDefinition,
  relationName: string,
  findManyOnSheet: FindManyOnSheet,
  options?: IncludeItemOptions,
): Record<string, unknown>[] => {
  if (parents.length === 0) return [];

  if (!relation.through) {
    throw new GassmaThroughRequiredError(relationName);
  }

  const through = relation.through;
  const sourceKeys = collectKeys(parents, relation.field);

  // Step 1: 中間テーブル取得
  const junctionRows = findManyOnSheet(through.sheet, {
    where: { [through.field]: { in: sourceKeys } },
  });

  if (junctionRows.length === 0) {
    return parents.map((p) => ({ ...p, [relationName]: [] }));
  }

  // Step 2: ターゲット取得
  const targetKeys = collectKeys(junctionRows, through.reference);
  const baseWhere: WhereUse = {
    [relation.reference]: { in: targetKeys },
  };
  const targetWhere: WhereUse = options?.where
    ? { AND: [baseWhere, options.where] }
    : baseWhere;

  const targets = findManyOnSheet(relation.to, { where: targetWhere });

  // Step 3: ターゲットをルックアップマップに
  const targetLookup = new Map<unknown, Record<string, unknown>>();
  targets.forEach((t) => {
    targetLookup.set(t[relation.reference], t);
  });

  // Step 4: 親→中間テーブル→ターゲットのマッピング
  const parentToTargets = new Map<unknown, Record<string, unknown>[]>();
  junctionRows.forEach((jRow) => {
    const parentKey = jRow[through.field];
    const target = targetLookup.get(jRow[through.reference]);
    if (!target) return;

    const list = parentToTargets.get(parentKey) ?? [];
    list.push(target);
    parentToTargets.set(parentKey, list);
  });

  return parents.map((parent) => {
    let items = parentToTargets.get(parent[relation.field]) ?? [];

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

export { resolveManyToMany };
