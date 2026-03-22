import type {
  IncludeData,
  IncludeItemOptions,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { WhereUse } from "../../../types/coreTypes";
import { GassmaSkipNegativeError } from "../../../errors/find/findError";
import { GassmaThroughRequiredError } from "../../../errors/relation/relationError";
import { orderByFunc } from "../../find/findUtil/orderBy";
import { applySelectOmit } from "../../find/findUtil/applySelectOmit";
import { applySelectRelations } from "../../find/findUtil/applySelectRelations";
import { collectKeys } from "../collectKeys";
import { processSelectForInclude } from "../processSelectForInclude";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse; include?: IncludeData },
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

  const processed = options?.select
    ? processSelectForInclude(options.select)
    : null;
  const mergedInclude = processed?.nestedInclude
    ? { ...(options?.include ?? {}), ...processed.nestedInclude }
    : options?.include;

  const targets = findManyOnSheet(relation.to, {
    where: targetWhere,
    include: mergedInclude,
  });

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

export { resolveManyToMany };
