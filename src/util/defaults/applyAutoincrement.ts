const applyAutoincrement = (
  data: Record<string, unknown>,
  fields: string[],
  values: Record<string, number>,
): Record<string, unknown> => {
  const result = { ...data };

  fields.forEach((field) => {
    if (field in result) return;
    result[field] = values[field];
  });

  return result;
};

export { applyAutoincrement };
