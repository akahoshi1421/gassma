import type { Select, Omit } from "../../../types/coreTypes";
import { GassmaFindSelectOmitConflictError } from "../../../errors/find/findError";
import { findedDataSelect } from "./findDataSelect";
import { omitFunc } from "./omit";

const applySelectOmit = (
  records: Record<string, unknown>[],
  select: Select | null | undefined,
  omit: Omit | null | undefined,
): Record<string, unknown>[] => {
  if (select && omit) {
    throw new GassmaFindSelectOmitConflictError();
  }

  if (select) {
    return records.map((row) => findedDataSelect(select, row));
  }

  if (omit) {
    return records.map((row) => omitFunc(omit, row));
  }

  return records;
};

export { applySelectOmit };
