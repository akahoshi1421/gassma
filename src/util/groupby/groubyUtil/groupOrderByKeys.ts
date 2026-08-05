import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import type { OrderBy } from "../../../types/coreTypes";
import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import { getTitle } from "../../core/getTitle";
import { isDict } from "../../other/isDict";

const AGGREGATE_KEYS = ["_avg", "_count", "_max", "_min", "_sum"];

type GroupSortKey = {
  key: string;
  value: unknown;
  field: string;
  aggregate: string | null;
};

const buildAggregateSortKeys = (
  aggregate: string,
  value: unknown,
  availableFields: string[],
): GroupSortKey[] => {
  if (!isDict(value)) {
    throw new GassmaInvalidValueError(aggregate, "an object of fields");
  }

  const fields = Object.keys(value);
  if (fields.length === 0) {
    throw new GassmaInvalidValueError(aggregate, "at least one field");
  }

  return fields.map((field) => {
    if (!availableFields.includes(field)) {
      throw new GassmaUnknownArgumentError(field, availableFields);
    }
    return {
      key: `a:${aggregate}:${field}`,
      value: value[field],
      field: field,
      aggregate: aggregate,
    };
  });
};

const buildFieldSortKey = (
  field: string,
  value: unknown,
  by: string[],
): GroupSortKey => {
  if (!by.includes(field)) {
    throw new GassmaUnknownArgumentError(field, [...by, ...AGGREGATE_KEYS]);
  }
  return { key: `f:${field}`, value: value, field: field, aggregate: null };
};

// Prisma 実測: by に無い列は orderBy に書けないが、集計の中の列は by に無くてよい
const buildGroupSortKeys = (
  orderByArr: Record<string, unknown>[],
  by: string[],
  getAvailableFields: () => string[],
): GroupSortKey[] => {
  return orderByArr.flatMap((entry) => {
    if (!isDict(entry)) {
      throw new GassmaInvalidValueError("orderBy", '"asc" | "desc"');
    }

    return Object.keys(entry).flatMap((key) =>
      AGGREGATE_KEYS.includes(key)
        ? buildAggregateSortKeys(key, entry[key], getAvailableFields())
        : [buildFieldSortKey(key, entry[key], by)],
    );
  });
};

const toOrderByArray = (
  orderBy: OrderBy | OrderBy[] | null | undefined,
): Record<string, unknown>[] => {
  if (orderBy === null || orderBy === undefined) return [];
  return Array.isArray(orderBy) ? orderBy : [orderBy];
};

const getAvailableFields = (
  gassmaControllerUtil: GassmaControllerUtil,
): string[] => {
  const ignoredFields =
    gassmaControllerUtil.whereValidation?.ignoredFields ?? [];

  return getTitle(gassmaControllerUtil).filter(
    (title) => !ignoredFields.includes(title),
  );
};

export { buildGroupSortKeys, toOrderByArray, getAvailableFields };
export type { GroupSortKey };
