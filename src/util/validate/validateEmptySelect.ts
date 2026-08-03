import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { isDict } from "../other/isDict";

// Prisma 実測(2026-08-03): select は空を許さない("must not be empty")
const validateEmptySelect = (input: unknown): void => {
  if (!isDict(input)) return;
  const select = input.select;
  if (isDict(select) && Object.keys(select).length === 0) {
    throw new GassmaInvalidValueError("select", "at least one selected field");
  }
};

export { validateEmptySelect };
