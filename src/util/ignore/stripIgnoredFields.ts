const stripIgnoredFields = (
  data: Record<string, unknown>,
  ignoredFields: string[],
): Record<string, unknown> => {
  if (ignoredFields.length === 0) return { ...data };
  const result: Record<string, unknown> = {};

  Object.keys(data).forEach((key) => {
    if (!ignoredFields.includes(key)) {
      result[key] = data[key];
    }
  });

  return result;
};

export { stripIgnoredFields };
