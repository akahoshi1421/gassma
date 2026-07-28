import { NestedWriteConnectNotFoundError } from "../../../../errors/relation/nestedWriteError";
import type { WhereUse } from "../../../../types/coreTypes";
import type { ConnectOrCreateInput } from "../../../../types/nestedWriteTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { createTargetTable } from "./targetTable";

type JunctionWriter = (targetValue: unknown) => void;

const batchManyToManyConnect = (
  relation: RelationDefinition,
  items: WhereUse[],
  context: RelationContext,
  createJunctionRow: JunctionWriter,
): void => {
  const table = createTargetTable(context, relation.to);

  const foundRecords = items.map((where) => {
    const found = table.canEvaluate(where)
      ? table.matchRecords(where)
      : context.findManyOnSheet(relation.to, { where });
    return found.length > 0 ? found[0] : null;
  });

  if (foundRecords.some((record) => record === null)) {
    throw new NestedWriteConnectNotFoundError(relation.to);
  }

  foundRecords.forEach((record) => {
    createJunctionRow(record[relation.reference]);
  });
};

const batchManyToManyConnectOrCreate = (
  relation: RelationDefinition,
  items: ConnectOrCreateInput[],
  context: RelationContext,
  createJunctionRow: JunctionWriter,
): void => {
  const table = createTargetTable(context, relation.to);
  let stale = false;

  const findLocally = (where: WhereUse): Record<string, unknown> | null => {
    const matched = table.matchRecords(where);
    if (matched.length > 0) return matched[0];
    if (!stale) return null;
    table.refresh();
    stale = false;
    const refreshed = table.matchRecords(where);
    return refreshed.length > 0 ? refreshed[0] : null;
  };

  const createTargetWithJunction = (input: ConnectOrCreateInput) => {
    const created = context.createOnSheet(relation.to, { data: input.create });
    stale = true;
    createJunctionRow(created[relation.reference]);
  };

  const legacyItem = (input: ConnectOrCreateInput) => {
    const found = context.findManyOnSheet(relation.to, { where: input.where });
    if (found.length > 0) {
      createJunctionRow(found[0][relation.reference]);
      return;
    }
    createTargetWithJunction(input);
  };

  items.forEach((input) => {
    if (!table.canEvaluate(input.where)) {
      legacyItem(input);
      return;
    }
    const found = findLocally(input.where);
    if (found !== null) {
      createJunctionRow(found[relation.reference]);
      return;
    }
    createTargetWithJunction(input);
  });
};

export { batchManyToManyConnect, batchManyToManyConnectOrCreate };
