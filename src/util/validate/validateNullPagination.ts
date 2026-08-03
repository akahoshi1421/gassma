import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { isDict } from "../other/isDict";
import type { ValidatedOperation } from "./validateTopLevelKeys";

// Prisma 実測: take / skip / limit の null は「Argument must not be null」エラー
const NULL_REJECTED_KEYS: Partial<Record<ValidatedOperation, string[]>> = {
  findMany: ["take", "skip"],
  findFirst: ["take", "skip"],
  count: ["take", "skip"],
  aggregate: ["take", "skip"],
  groupBy: ["take", "skip"],
  updateMany: ["limit"],
  updateManyAndReturn: ["limit"],
  deleteMany: ["limit"],
};

const validateNullPagination = (
  operation: ValidatedOperation,
  input: unknown,
): void => {
  const keys = NULL_REJECTED_KEYS[operation];
  if (!keys || !isDict(input)) return;

  keys.forEach((key) => {
    if (input[key] !== null) return;
    throw new GassmaInvalidValueError(key, "a number, but received null");
  });
};

export { validateNullPagination };
