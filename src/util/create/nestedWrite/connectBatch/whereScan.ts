import { isFieldRef } from "../../../filterConditions/fieldRef";
import { isDict } from "../../../other/isDict";

const LOGIC_KEYS = new Set(["AND", "OR", "NOT"]);

const collectFieldRefNames = (value: unknown, keys: Set<string>): void => {
  if (isFieldRef(value)) {
    keys.add(value.name);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectFieldRefNames(item, keys);
    });
    return;
  }
  if (isDict(value)) {
    Object.values(value).forEach((item) => {
      collectFieldRefNames(item, keys);
    });
  }
};

const collectInto = (where: Record<string, unknown>, keys: Set<string>) => {
  Object.entries(where).forEach(([key, value]) => {
    if (LOGIC_KEYS.has(key)) {
      const branches = Array.isArray(value) ? value : [value];
      branches.forEach((branch) => {
        if (isDict(branch)) collectInto(branch, keys);
      });
      return;
    }
    keys.add(key);
    collectFieldRefNames(value, keys);
  });
};

const collectWhereFieldKeys = (where: Record<string, unknown>): Set<string> => {
  const keys = new Set<string>();
  collectInto(where, keys);
  return keys;
};

const hasTopLevelEmptyString = (where: Record<string, unknown>): boolean =>
  Object.entries(where).some(
    ([key, value]) => !LOGIC_KEYS.has(key) && value === "",
  );

export { collectWhereFieldKeys, hasTopLevelEmptyString };
