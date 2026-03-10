type FieldMapping = {
  [codeName: string]: string;
};

const mapToSheet = (
  data: Record<string, unknown>,
  mapping: FieldMapping,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.keys(data).forEach((key) => {
    const sheetKey = mapping[key] ?? key;
    result[sheetKey] = data[key];
  });

  return result;
};

const mapFromSheet = (
  data: Record<string, unknown>,
  mapping: FieldMapping,
): Record<string, unknown> => {
  const reverse: Record<string, string> = {};
  Object.keys(mapping).forEach((codeName) => {
    reverse[mapping[codeName]] = codeName;
  });

  const result: Record<string, unknown> = {};
  Object.keys(data).forEach((key) => {
    const codeName = reverse[key] ?? key;
    result[codeName] = data[key];
  });

  return result;
};

export { mapToSheet, mapFromSheet };
export type { FieldMapping };
