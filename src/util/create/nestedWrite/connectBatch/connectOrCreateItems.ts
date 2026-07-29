import type { AnyUse, GassmaAny, WhereUse } from "../../../../types/coreTypes";
import type { ConnectOrCreateInput } from "../../../../types/nestedWriteTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { createTargetTable } from "./targetTable";
import { collectWhereFieldKeys, hasTopLevelEmptyString } from "./whereScan";

const referencesFkColumn = (
  items: ConnectOrCreateInput[],
  fkColumn: string,
): boolean =>
  items.some((input) => collectWhereFieldKeys(input.where).has(fkColumn));

const batchConnectOrCreate = (
  relation: RelationDefinition,
  items: ConnectOrCreateInput[],
  parentValue: GassmaAny,
  context: RelationContext,
): void => {
  const fkData: AnyUse = { [relation.reference]: parentValue };

  const createItem = (input: ConnectOrCreateInput) => {
    context.createOnSheet(relation.to, {
      data: { ...input.create, [relation.reference]: parentValue },
    });
  };

  const legacyItem = (input: ConnectOrCreateInput): boolean => {
    const found = context.findManyOnSheet(relation.to, { where: input.where });
    if (found.length > 0) {
      context.updateManyOnSheet(relation.to, {
        where: input.where,
        data: fkData,
      });
      return false;
    }
    createItem(input);
    return true;
  };

  if (referencesFkColumn(items, relation.reference)) {
    items.forEach((input) => {
      legacyItem(input);
    });
    return;
  }

  const table = createTargetTable(context, relation.to);
  const deferredWheres: WhereUse[] = [];
  let stale = false;

  const existsLocally = (where: WhereUse): boolean => {
    if (table.matchRecords(where).length > 0) return true;
    if (!stale) return false;
    table.refresh();
    stale = false;
    return table.matchRecords(where).length > 0;
  };

  const eligibleItem = (input: ConnectOrCreateInput) => {
    if (!existsLocally(input.where)) {
      createItem(input);
      stale = true;
      return;
    }
    if (hasTopLevelEmptyString(input.where)) {
      context.updateManyOnSheet(relation.to, {
        where: input.where,
        data: fkData,
      });
      return;
    }
    deferredWheres.push(input.where);
  };

  items.forEach((input) => {
    if (table.canEvaluate(input.where)) {
      eligibleItem(input);
      return;
    }
    if (legacyItem(input)) stale = true;
  });

  if (deferredWheres.length === 1) {
    context.updateManyOnSheet(relation.to, {
      where: deferredWheres[0],
      data: fkData,
    });
  }
  if (deferredWheres.length >= 2) {
    context.updateManyOnSheet(relation.to, {
      where: { OR: deferredWheres },
      data: fkData,
    });
  }
};

export { batchConnectOrCreate };
