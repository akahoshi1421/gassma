import type { Lock } from "../../types/relationTypes";

const runWithLock = <T>(
  lock: Lock | null | undefined,
  timeoutMs: number,
  fn: () => T,
): T => {
  if (!lock || lock.hasLock()) return fn();

  lock.waitLock(timeoutMs);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
};

export { runWithLock };
