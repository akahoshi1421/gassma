class GassmaUpdateWhereMissingError extends Error {
  constructor() {
    super("Argument `where` is missing.");
    this.name = "GassmaUpdateWhereMissingError";
  }
}

export { GassmaUpdateWhereMissingError };
