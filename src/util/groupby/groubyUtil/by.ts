import { isDateValue } from "../../other/isDateValue";
import { toLookupKey } from "../../other/toLookupKey";

const isSelfUnequal = (value: unknown): boolean =>
  isDateValue(value)
    ? Number.isNaN(value.getTime())
    : typeof value === "number" && Number.isNaN(value);

const groupByColumn = (
  rows: Record<string, any>[],
  column: string,
): Record<string, any>[][] => {
  const groups = new Map<unknown, Record<string, any>[]>();

  rows.forEach((row) => {
    const data = row[column];
    const selfUnequal = isSelfUnequal(data);
    const key = selfUnequal && isDateValue(data) ? data : toLookupKey(data);
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, selfUnequal ? [] : [row]);
      return;
    }

    if (!selfUnequal) group.push(row);
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
