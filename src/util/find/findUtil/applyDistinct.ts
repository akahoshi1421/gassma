import { toLookupKey } from "../../other/toLookupKey";

const toDistinctKeyPart = (value: unknown): string => {
  const key = toLookupKey(value);
  if (typeof key === "string") return key;
  if (typeof key === "object" && key !== null) {
    return `json:${JSON.stringify(key)}`;
  }
  return `raw:${String(key)}`;
};

const applyDistinct = (
  records: Record<string, unknown>[],
  distinct: string | string[],
): Record<string, unknown>[] => {
  const distinctKeys = Array.isArray(distinct) ? distinct : [distinct];
  const seen = new Set<string>();

  return records.filter((row) => {
    const key = JSON.stringify(
      distinctKeys.map((k) => toDistinctKeyPart(row[k])),
    );

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export { applyDistinct };
