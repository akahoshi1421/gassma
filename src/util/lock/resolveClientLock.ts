import { GassmaInvalidLockError } from "../../errors/lock/lockError";
import type { Lock } from "../../types/relationTypes";

const isFunctionProperty = (value: object, key: string): boolean =>
  typeof Reflect.get(value, key) === "function";

const isLockLike = (value: unknown): value is Lock => {
  if (typeof value !== "object" || value === null) return false;
  return (
    isFunctionProperty(value, "waitLock") &&
    isFunctionProperty(value, "releaseLock") &&
    isFunctionProperty(value, "hasLock")
  );
};

const resolveClientLock = (lock: unknown): Lock | undefined => {
  if (lock === undefined) return undefined;
  if (!isLockLike(lock)) throw new GassmaInvalidLockError();
  return lock;
};

export { resolveClientLock };
