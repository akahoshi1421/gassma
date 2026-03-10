type SheetNameMapping = { [codeName: string]: string };

const resolveSheetName = (
  codeName: string,
  mapping: SheetNameMapping,
): string => {
  return mapping[codeName] ?? codeName;
};

const resolveCodeName = (
  sheetName: string,
  mapping: SheetNameMapping,
): string => {
  const entry = Object.keys(mapping).find((key) => mapping[key] === sheetName);
  return entry ?? sheetName;
};

export { resolveSheetName, resolveCodeName };
export type { SheetNameMapping };
