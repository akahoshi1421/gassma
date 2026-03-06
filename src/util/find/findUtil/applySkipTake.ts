import { GassmaSkipNegativeError } from "../../../errors/find/findError";

const applySkipTake = (
  records: Record<string, unknown>[],
  skip: number | null | undefined,
  take: number | null | undefined,
): Record<string, unknown>[] => {
  let result = [...records];

  if (skip !== null && skip !== undefined && skip < 0) {
    throw new GassmaSkipNegativeError(skip);
  }

  if (take !== null && take !== undefined) {
    if (take === 0) {
      return [];
    }
    if (take > 0) {
      if (skip) result = result.slice(skip);
      return result.slice(0, take);
    }
    // negative take
    if (skip) result = result.slice(0, -skip);
    return result.slice(take);
  }

  if (skip) result = result.slice(skip);
  return result;
};

export { applySkipTake };
