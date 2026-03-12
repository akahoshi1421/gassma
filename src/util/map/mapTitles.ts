import type { FieldMapping } from "./mapFields";

const mapTitles = (titles: string[], mapping: FieldMapping): string[] => {
  const reverse: Record<string, string> = {};
  Object.keys(mapping).forEach((codeName) => {
    reverse[mapping[codeName]] = codeName;
  });

  return titles.map((title) => reverse[title] ?? title);
};

export { mapTitles };
