class GassmaMissingArgumentError extends Error {
  constructor(argumentName: string) {
    super(`Argument \`${argumentName}\` is missing.`);
    this.name = "GassmaMissingArgumentError";
  }
}

export { GassmaMissingArgumentError };
