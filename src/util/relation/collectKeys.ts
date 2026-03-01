import type { GassmaAny } from "../../types/coreTypes";

const isGassmaAny = (value: unknown): value is GassmaAny => {
  if (value === null || value === undefined) return false;
  const t = typeof value;
  return (
    t === "string" || t === "number" || t === "boolean" || value instanceof Date
  );
};

const collectKeys = (
  records: Record<string, unknown>[],
  field: string,
): GassmaAny[] => {
  return records.map((r) => r[field]).filter(isGassmaAny);
};

export { collectKeys, isGassmaAny };
