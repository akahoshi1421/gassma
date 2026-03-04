import type { Select } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import { resolveCount } from "../../relation/resolveCount";
import { findedDataSelect } from "./findDataSelect";

const applySelectCount = (
  records: Record<string, unknown>[],
  countValue: unknown,
  scalarSelect: Select | null,
  context: RelationContext,
): Record<string, unknown>[] => {
  const withCount = resolveCount(records, countValue, context);

  if (!scalarSelect || Object.keys(scalarSelect).length === 0) {
    return withCount.map((row) => ({ _count: row._count }));
  }

  return withCount.map((row) => ({
    ...findedDataSelect(scalarSelect, row),
    _count: row._count,
  }));
};

export { applySelectCount };
