const applyUpdatedAt = (
  data: Record<string, unknown>,
  field: string,
): Record<string, unknown> => {
  if (field in data) return { ...data };
  return { ...data, [field]: new Date() };
};

export { applyUpdatedAt };
