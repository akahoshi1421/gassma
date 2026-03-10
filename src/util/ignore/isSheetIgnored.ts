const isSheetIgnored = (
  sheetName: string,
  ignoredSheets: string[],
): boolean => {
  return ignoredSheets.includes(sheetName);
};

export { isSheetIgnored };
