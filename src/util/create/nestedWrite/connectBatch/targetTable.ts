import type { GassmaAny, WhereUse } from "../../../../types/coreTypes";
import type { RelationContext } from "../../../../types/relationTypes";
import { filterRowsByWhere } from "../../../core/filterRowsByWhere";
import { isGassmaAny } from "../../../relation/collectKeys";
import { collectWhereFieldKeys } from "./whereScan";

type TargetTable = {
  refresh: () => void;
  canEvaluate: (where: WhereUse) => boolean;
  matchRecords: (where: WhereUse) => Record<string, unknown>[];
};

const toCellValue = (value: unknown): GassmaAny =>
  isGassmaAny(value) ? value : null;

const createTargetTable = (
  context: RelationContext,
  sheetName: string,
): TargetTable => {
  let records: Record<string, unknown>[] | null = null;
  let titles: string[] = [];
  let titleSet = new Set<string>();
  let rows: GassmaAny[][] = [];

  const relationNames = new Set(
    context.relationNamesOnSheet ? context.relationNamesOnSheet(sheetName) : [],
  );

  const refresh = () => {
    const fetched = context.findManyOnSheet(sheetName, {});
    records = fetched;
    titles = fetched.length > 0 ? Object.keys(fetched[0]) : [];
    titleSet = new Set(titles);
    rows = fetched.map((record) => titles.map((t) => toCellValue(record[t])));
  };

  const ensure = () => {
    if (records === null) refresh();
  };

  const canEvaluate = (where: WhereUse): boolean => {
    ensure();
    const emptyTable = records.length === 0;
    let evaluable = true;
    collectWhereFieldKeys(where).forEach((key) => {
      if (relationNames.has(key)) evaluable = false;
      if (!emptyTable && !titleSet.has(key)) evaluable = false;
    });
    return evaluable;
  };

  const matchRecords = (where: WhereUse): Record<string, unknown>[] => {
    ensure();
    const hits = filterRowsByWhere(rows, titles, where);
    return hits.map((hit) => records[hit.rowNumber - 1]);
  };

  return { refresh, canEvaluate, matchRecords };
};

export { createTargetTable };
export type { TargetTable };
