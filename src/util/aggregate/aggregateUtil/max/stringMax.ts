const getStringMax = (stringArray: string[]) =>
  stringArray.reduce((max, str) => (str > max ? str : max), stringArray[0]);

export { getStringMax };
