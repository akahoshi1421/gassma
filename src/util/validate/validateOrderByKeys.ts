import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../errors/argument/argumentError";
import type { OrderBy } from "../../types/coreTypes";
import { isRelationOrderByValue } from "../find/findUtil/separateRelationOrderBy";
import { isDict } from "../other/isDict";

const validateOrderByEntryKey = (
  key: string,
  value: unknown,
  titles: string[],
  relationNames: string[],
): void => {
  if (isRelationOrderByValue(value)) {
    if (relationNames.includes(key) || titles.includes(key)) return;
    throw new GassmaUnknownArgumentError(key, [...titles, ...relationNames]);
  }
  if (titles.includes(key)) return;
  if (relationNames.includes(key)) {
    throw new GassmaInvalidValueError(key, "a relation orderBy object");
  }
  throw new GassmaUnknownArgumentError(key, [...titles, ...relationNames]);
};

const validateOrderByKeys = (
  orderByArr: OrderBy[],
  titles: string[],
  relationNames: string[],
): void => {
  orderByArr.forEach((entry) => {
    if (!isDict(entry)) {
      throw new GassmaInvalidValueError("orderBy", '"asc" | "desc"');
    }
    Object.entries(entry).forEach(([key, value]) => {
      validateOrderByEntryKey(key, value, titles, relationNames);
    });
  });
};

export { validateOrderByKeys };
