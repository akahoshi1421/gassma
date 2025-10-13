const getBooleanMin = (booleanArray: boolean[]) => {
  const changedBooleanToNumber = booleanArray.map((bool) => (bool ? 1 : 0));

  const booleanToNumberMin = Math.min(...changedBooleanToNumber);

  return booleanToNumberMin === 1;
};

export { getBooleanMin };
