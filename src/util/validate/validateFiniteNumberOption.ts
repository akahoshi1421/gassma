import { GassmaInvalidValueError } from "../../errors/argument/argumentError";

const validateFiniteNumberOption = (
  argumentName: string,
  value: number | null | undefined,
): void => {
  if (typeof value !== "number") return;
  if (Number.isFinite(value)) return;
  throw new GassmaInvalidValueError(
    argumentName,
    `a finite number, but received ${String(value)}`,
  );
};

export { validateFiniteNumberOption };
