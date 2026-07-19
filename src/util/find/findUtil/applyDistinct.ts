const applyDistinct = (
  records: Record<string, unknown>[],
  distinct: string | string[],
): Record<string, unknown>[] => {
  const distinctKeys = Array.isArray(distinct) ? distinct : [distinct];
  const seen = new Set<string>();

  return records.filter((row) => {
    const key = distinctKeys.map((k) => JSON.stringify(row[k])).join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export { applyDistinct };
