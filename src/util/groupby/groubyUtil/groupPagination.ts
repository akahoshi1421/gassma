import { GassmaMissingArgumentError } from "../../../errors/argument/argumentError";
import { applySkipTake } from "../../find/findUtil/applySkipTake";

const hasEffectiveOrderBy = (orderByArr: Record<string, unknown>[]): boolean =>
  orderByArr.some(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      Object.keys(entry).length > 0,
  );

// Prisma 実測: take があるか skip が 0 以外なら orderBy が必須。空の orderBy は数えない
const ensurePaginationOrderBy = (
  orderByArr: Record<string, unknown>[],
  take: number | null | undefined,
  skip: number | null | undefined,
): void => {
  if (typeof take !== "number" && !skip) return;
  if (hasEffectiveOrderBy(orderByArr)) return;

  throw new GassmaMissingArgumentError("orderBy");
};

// Prisma 実測: groupBy の負の take は findMany と違い、反転した並びのまま返す
const applyGroupSkipTake = (
  results: Record<string, unknown>[],
  skip: number | null | undefined,
  take: number | null | undefined,
): Record<string, unknown>[] => {
  const backward = typeof take === "number" && take < 0;
  const ordered = backward ? [...results].reverse() : results;

  return applySkipTake(ordered, skip, backward ? -take : take);
};

export { ensurePaginationOrderBy, applyGroupSkipTake };
