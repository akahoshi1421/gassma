import { GassmaFindFirstTakeError } from "../../../errors/find/findError";

// findFirst の take は 1 | -1 のみ。-1 は並びを反転する（Prisma パリティ）
const applyFindFirstTake = (
  records: Record<string, unknown>[],
  take: number | null | undefined,
): Record<string, unknown>[] => {
  if (take === null || take === undefined || take === 1) return records;
  if (take === -1) return [...records].reverse();
  throw new GassmaFindFirstTakeError();
};

export { applyFindFirstTake };
