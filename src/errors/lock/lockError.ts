class GassmaInvalidLockError extends Error {
  constructor() {
    super(
      "`lock` must be a Lock returned by LockService. LockService.getDocumentLock() returns null in a standalone script or a web app; use LockService.getScriptLock() instead.",
    );
    this.name = "GassmaInvalidLockError";
  }
}

export { GassmaInvalidLockError };
