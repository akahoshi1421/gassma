import type { AnyUse, GassmaAny } from "../../../types/coreTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import { isCellValue } from "./cellValue";
import { isNestedWriteOperation } from "./extractRelationData";

const hasNestedWrite = (item: Record<string, unknown>): boolean =>
  Object.values(item).some(isNestedWriteOperation);

const isRow = (row: AnyUse | null): row is AnyUse => row !== null;

const batchNestedCreate = (
  relation: RelationDefinition,
  items: Record<string, unknown>[],
  parentValue: GassmaAny,
  context: RelationContext,
): void => {
  const oneByOne = () => {
    items.forEach((item) => {
      context.createOnSheet(relation.to, {
        data: { ...item, [relation.reference]: parentValue },
      });
    });
  };

  const buildRow = (item: Record<string, unknown>): AnyUse | null => {
    const row: AnyUse = {};
    let complete = true;
    Object.keys(item).forEach((key) => {
      const value = item[key];
      if (!isCellValue(value)) {
        complete = false;
        return;
      }
      row[key] = value;
    });
    if (!complete) return null;
    row[relation.reference] = parentValue;
    return row;
  };

  if (items.length < 2 || !context.createManyOnSheet) {
    oneByOne();
    return;
  }
  if (items.some(hasNestedWrite)) {
    oneByOne();
    return;
  }

  const rows = items.map(buildRow);
  if (!rows.every(isRow)) {
    oneByOne();
    return;
  }

  context.createManyOnSheet(relation.to, { data: rows });
};

export { batchNestedCreate };
