import { toLookupKey } from "../../other/toLookupKey";

const groupByColumn = (
  rows: Record<string, any>[],
  column: string,
): Record<string, any>[][] => {
  const groups = new Map<unknown, Record<string, any>[]>();

  rows.forEach((row) => {
    const key = toLookupKey(row[column]);
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, [row]);
      return;
    }

    group.push(row);
  });

  return Array.from(groups.values());
};

const bySearch = (
  rows: Record<string, any>[],
  byData: string[],
  depth: number,
): any[] => {
  if (depth === byData.length) return rows;

  return groupByColumn(rows, byData[depth]).map((group) =>
    bySearch(group, byData, depth + 1),
  );
};

const byClassification = (rows: Record<string, any>[], byData: string[]) => {
  const classificationedRows = bySearch(rows, byData, 0);
  const classificationedRowsFlat = classificationedRows.flat(byData.length - 1);

  return classificationedRowsFlat;
};

export { byClassification };
