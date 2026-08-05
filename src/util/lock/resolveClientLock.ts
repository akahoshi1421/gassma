import { GassmaInvalidLockError } from "../../errors/lock/lockError";

const isLockLike = (value: unknown): value is GoogleAppsScript.Lock.Lock => {
  if (typeof value !== "object" || value === null) return false;
  if (!("waitLock" in value)) return false;
  return typeof value.waitLock === "function";
};

const resolveClientLock = (
  lock: unknown,
): GoogleAppsScript.Lock.Lock | undefined => {
  if (lock === undefined) return undefined;
  if (!isLockLike(lock)) throw new GassmaInvalidLockError();
  return lock;
};

export { resolveClientLock };
