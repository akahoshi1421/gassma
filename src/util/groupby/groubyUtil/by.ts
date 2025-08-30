import type { GassmaAny } from "../../../types/coreTypes";

const bySearch = (rows: {}[], byData: string[], depth: number): any[] => {
  if (depth === byData.length) return rows;

  const matches: GassmaAny[] = [];

  rows.forEach((row) => {
    const data = row[byData[depth]];

    if (matches.includes(data)) return;

    matches.push(data as GassmaAny);
  });

  const classificationedMatches = matches.map((match) =>
    rows.filter((row) => {
      const data = row[byData[depth]];

      return data === match;
    })
  );

  const result = classificationedMatches.map((classificationedMatch) =>
    bySearch(classificationedMatch, byData, depth + 1)
  );

  return result;
};

const byClassification = (rows: {}[], byData: string[]) => {
  const classificationedRows = bySearch(rows, byData, 0);
  const classificationedRowsFlat = classificationedRows.flat(byData.length - 1);

  return classificationedRowsFlat;
};

export { byClassification };
