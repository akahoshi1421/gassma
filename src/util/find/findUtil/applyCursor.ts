const applyCursor = (
  records: Record<string, unknown>[],
  cursor: Record<string, unknown>,
  take: number | null | undefined,
): Record<string, unknown>[] => {
  const cursorEntries = Object.entries(cursor);
  const index = records.findIndex((record) =>
    cursorEntries.every(([key, value]) => record[key] === value),
  );
  if (index === -1) return [];

  if (take !== null && take !== undefined && take < 0) {
    return records.slice(0, index + 1);
  }
  return records.slice(index);
};

export { applyCursor };
