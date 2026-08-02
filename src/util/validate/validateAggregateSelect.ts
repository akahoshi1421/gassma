import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../errors/argument/argumentError";
import type { CountAggregateSelect } from "../../types/countType";

const validateAggregateSelect = (
  select: CountAggregateSelect,
  titles: string[],
  ignoredFields: string[],
  extraKeys: string[],
): string[] => {
  const availableArguments = titles
    .filter((title) => !ignoredFields.includes(title))
    .concat(extraKeys);

  const keys = Object.keys(select);
  if (keys.length === 0) {
    throw new GassmaInvalidValueError("select", "a non-empty object");
  }

  keys.forEach((key) => {
    if (!availableArguments.includes(key)) {
      throw new GassmaUnknownArgumentError(key, availableArguments);
    }
  });

  const truthyKeys = keys.filter((key) => select[key]);
  if (truthyKeys.length === 0) {
    throw new GassmaInvalidValueError("select", "at least one truthy value");
  }

  return truthyKeys;
};

export { validateAggregateSelect };
