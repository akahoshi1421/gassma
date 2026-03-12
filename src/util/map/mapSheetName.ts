type SheetNameMapping = { [codeName: string]: string };

const resolveCodeName = (
  sheetName: string,
  mapping: SheetNameMapping,
): string => {
  const entry = Object.keys(mapping).find((key) => mapping[key] === sheetName);
  return entry ?? sheetName;
};

export { resolveCodeName };
export type { SheetNameMapping };
