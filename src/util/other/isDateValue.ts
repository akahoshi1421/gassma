const isDateValue = (value: unknown): value is Date => {
  return (
    value instanceof Date ||
    Object.prototype.toString.call(value) === "[object Date]"
  );
};

export { isDateValue };
