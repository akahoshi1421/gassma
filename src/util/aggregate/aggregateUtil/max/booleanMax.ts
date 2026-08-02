const getBooleanMax = (booleanArray: boolean[]) => {
  const booleanToNumberMax = booleanArray.reduce(
    (max, bool) => Math.max(max, bool ? 1 : 0),
    Number.NEGATIVE_INFINITY,
  );

  return booleanToNumberMax === 1;
};

export { getBooleanMax };
