const getBooleanMax = (booleanArray: boolean[]) => {
  const changedBooleanToNumber = booleanArray.map((bool) => (bool ? 1 : 0));

  const booleanToNumberMax = Math.max(...changedBooleanToNumber);

  return booleanToNumberMax === 1;
};

export { getBooleanMax };
