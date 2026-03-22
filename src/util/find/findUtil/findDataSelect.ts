const findedDataSelect = (
  select: Record<string, unknown>,
  row: Record<string, unknown>,
) => {
  const result = {};
  const selectKeys = Object.keys(select);

  selectKeys.forEach((key) => {
    result[key] = row[key];
  });

  return result;
};

export { findedDataSelect };
