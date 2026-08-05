const KEY_PREFIX = "gassma_autoincrement_";

const buildAutoincrementKey = (keyBase: string, field: string): string =>
  `${KEY_PREFIX}${keyBase}_${field}`;

export { buildAutoincrementKey };
