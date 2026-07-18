const isValueEqual = (a: unknown, b: unknown): boolean => {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return a === b;
};

const containsValue = (list: readonly unknown[], value: unknown): boolean =>
  list.includes(value) || list.some((item) => isValueEqual(item, value));

export { containsValue, isValueEqual };
