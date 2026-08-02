import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
import type { WhereValidation } from "../../types/gassmaControllerUtilType";
import { isDict } from "../other/isDict";

const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);

const walk = (
  where: Record<string, unknown>,
  allowed: Set<string>,
  availableArguments: string[],
): void => {
  Object.entries(where).forEach(([key, value]) => {
    if (LOGICAL_KEYS.has(key)) {
      const branches = Array.isArray(value) ? value : [value];
      branches.forEach((branch) => {
        if (!isDict(branch)) return;
        walk(branch, allowed, availableArguments);
      });
      return;
    }
    if (value === undefined) return;
    if (!allowed.has(key)) {
      throw new GassmaUnknownArgumentError(key, availableArguments);
    }
  });
};

const validateWhereColumns = (
  where: Record<string, unknown>,
  titles: string[],
  validation: WhereValidation,
): void => {
  const allowedColumns = titles.filter(
    (title) => !validation.ignoredFields.includes(title),
  );
  walk(where, new Set(allowedColumns), [
    ...allowedColumns,
    ...validation.relationNames,
  ]);
};

export { validateWhereColumns };
