import type { AnyUse } from "../../../../types/coreTypes";
import type {
  ManyToManyThrough,
  RelationContext,
} from "../../../../types/relationTypes";
import { isCellValue } from "../cellValue";

type JunctionWriter = {
  add: (targetValue: unknown) => void;
  flush: () => void;
};

const createJunctionWriter = (
  context: RelationContext,
  through: ManyToManyThrough,
  parentValue: unknown,
): JunctionWriter => {
  const pending: unknown[] = [];

  const buildBatch = (values: unknown[]): AnyUse[] | null => {
    if (!isCellValue(parentValue)) return null;
    const parent = parentValue;
    if (!values.every(isCellValue)) return null;
    return values.map((value) => ({
      [through.field]: parent,
      [through.reference]: value,
    }));
  };

  const writeOneByOne = (values: unknown[]) => {
    values.forEach((value) => {
      context.createOnSheet(through.sheet, {
        data: { [through.field]: parentValue, [through.reference]: value },
      });
    });
  };

  const flush = () => {
    if (pending.length === 0) return;
    const values = pending.splice(0, pending.length);
    const rows =
      values.length > 1 && context.createManyOnSheet
        ? buildBatch(values)
        : null;
    if (!rows) {
      writeOneByOne(values);
      return;
    }
    context.createManyOnSheet(through.sheet, { data: rows });
  };

  return {
    add: (targetValue) => {
      pending.push(targetValue);
    },
    flush,
  };
};

export { createJunctionWriter };
export type { JunctionWriter };
