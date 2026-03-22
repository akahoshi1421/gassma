const applySelectRelations = (
  records: Record<string, unknown>[],
  scalarSelect: Record<string, unknown> | null,
  relationKeys: string[],
  countValue?: unknown,
): Record<string, unknown>[] => {
  return records.map((row) => {
    const result: Record<string, unknown> = {};

    if (scalarSelect) {
      Object.keys(scalarSelect).forEach((key) => {
        result[key] = row[key];
      });
    }

    relationKeys.forEach((key) => {
      result[key] = row[key];
    });

    if (countValue !== undefined) {
      result._count = row._count;
    }

    return result;
  });
};

export { applySelectRelations };
