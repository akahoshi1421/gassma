const getNumberSum = (numberArray: number[]) => {
  return numberArray.reduce((pre, now) => pre + now);
};

export { getNumberSum };
