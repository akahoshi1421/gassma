import { isValueEqual } from "../../other/isValueEqual";

const applyCursor = (
  records: Record<string, unknown>[],
  cursor: Record<string, unknown>,
): Record<string, unknown>[] => {
  const cursorEntries = Object.entries(cursor);
  const index = records.findIndex((record) =>
    cursorEntries.every(([key, value]) => isValueEqual(record[key], value)),
  );
  if (index === -1) return [];

  return records.slice(index);
};

export { applyCursor };
