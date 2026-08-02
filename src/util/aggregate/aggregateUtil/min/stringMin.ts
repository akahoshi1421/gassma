const getStringMin = (stringArray: string[]) =>
  stringArray.reduce((min, str) => (str < min ? str : min), stringArray[0]);

export { getStringMin };
