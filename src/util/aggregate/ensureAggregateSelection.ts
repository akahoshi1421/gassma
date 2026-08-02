import { GassmaAggregateSelectionRequiredError } from "../../errors/aggregate/aggregateError";
import type { AggregateData } from "../../types/aggregateType";

const aggregateKeys: (keyof AggregateData)[] = [
  "_avg",
  "_count",
  "_max",
  "_min",
  "_sum",
];

const hasSelectedField = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value !== "object" || value === null) return false;
  return Object.keys(value).length > 0;
};

const ensureAggregateSelection = (aggregateData: AggregateData): void => {
  const selected = aggregateKeys.some((key) =>
    hasSelectedField(aggregateData[key]),
  );
  if (selected) return;

  throw new GassmaAggregateSelectionRequiredError();
};

export { ensureAggregateSelection };
