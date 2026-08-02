const getBooleanMin = (booleanArray: boolean[]) => {
  const booleanToNumberMin = booleanArray.reduce(
    (min, bool) => Math.min(min, bool ? 1 : 0),
    Number.POSITIVE_INFINITY,
  );

  return booleanToNumberMin === 1;
};

export { getBooleanMin };
