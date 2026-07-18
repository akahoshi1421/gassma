class GassmaUndefinedValueError extends Error {
  constructor(path: string) {
    super(
      `Invalid value for argument \`${path}\`: explicitly \`undefined\` values are not allowed.`,
    );
    this.name = "GassmaUndefinedValueError";
  }
}

class GassmaSkipInArrayError extends Error {
  constructor(path: string) {
    super(
      `Invalid value for argument \`${path}\`: Can not use \`Gassma.skip\` value within array. Use \`null\` or filter out \`Gassma.skip\` values.`,
    );
    this.name = "GassmaSkipInArrayError";
  }
}

export { GassmaUndefinedValueError, GassmaSkipInArrayError };
