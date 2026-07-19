import { applyCursor } from "./applyCursor";
import { applyDistinct } from "./applyDistinct";
import { applySkipTake } from "./applySkipTake";

// Prisma 実測順: take 負数は反転順で cursor → distinct → skip → take し、出力は正順に戻す
const applyCursorDistinctSkipTake = (
  records: Record<string, unknown>[],
  cursor: Record<string, unknown> | null | undefined,
  distinct: string | string[] | null | undefined,
  skip: number | null | undefined,
  take: number | null | undefined,
): Record<string, unknown>[] => {
  const backward = typeof take === "number" && take < 0;

  let result = backward ? [...records].reverse() : records;

  if (cursor) result = applyCursor(result, cursor, null);
  if (distinct) result = applyDistinct(result, distinct);

  result = applySkipTake(result, skip, backward ? -take : take);

  return backward ? [...result].reverse() : result;
};

export { applyCursorDistinctSkipTake };
