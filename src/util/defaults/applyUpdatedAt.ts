const applyUpdatedAt = (
  data: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> => {
  const result = { ...data };
  const now = new Date();

  fields.forEach((field) => {
    if (field in result) return;
    result[field] = now;
  });

  return result;
};

export { applyUpdatedAt };
