const stripIgnoreFromSelect = (
  select: Record<string, unknown>,
  ignoredFields: string[],
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.keys(select).forEach((key) => {
    if (ignoredFields.indexOf(key) === -1) {
      result[key] = select[key];
    }
  });
  return result;
};

export { stripIgnoreFromSelect };
