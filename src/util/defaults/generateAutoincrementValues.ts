const LOCK_TIMEOUT_MS = 10000;
const KEY_PREFIX = "gassma_autoincrement_";

const generateAutoincrementValues = (
  fields: string[],
  keyBase: string,
  count?: number,
): Record<string, number | number[]> => {
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);

  try {
    const props = PropertiesService.getScriptProperties();
    const result: Record<string, number | number[]> = {};

    fields.forEach((field) => {
      const key = `${KEY_PREFIX}${keyBase}_${field}`;
      const current = Number(props.getProperty(key) || 0);

      if (count && count > 1) {
        const values: number[] = [];
        let next = current;
        Array.from({ length: count }).forEach(() => {
          next += 1;
          values.push(next);
        });
        props.setProperty(key, String(next));
        result[field] = values;
      } else {
        const next = current + 1;
        props.setProperty(key, String(next));
        result[field] = next;
      }
    });

    return result;
  } finally {
    lock.releaseLock();
  }
};

export { generateAutoincrementValues };
