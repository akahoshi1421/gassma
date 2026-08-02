import { suggestClosest } from "../../util/other/suggestClosest";

class GassmaMissingArgumentError extends Error {
  constructor(argumentName: string) {
    super(`Argument \`${argumentName}\` is missing.`);
    this.name = "GassmaMissingArgumentError";
  }
}

class GassmaUnknownArgumentError extends Error {
  constructor(argumentName: string, availableArguments: string[]) {
    const available = Array.isArray(availableArguments)
      ? availableArguments
      : [];
    const suggestion = suggestClosest(argumentName, available);
    const head =
      suggestion === null
        ? `Unknown argument \`${argumentName}\`.`
        : `Unknown argument \`${argumentName}\`. Did you mean \`${suggestion}\`?`;
    const tail =
      available.length === 0 ? "" : `\n\nAvailable: ${available.join(", ")}`;
    super(`${head}${tail}`);
    this.name = "GassmaUnknownArgumentError";
  }
}

export { GassmaMissingArgumentError, GassmaUnknownArgumentError };
