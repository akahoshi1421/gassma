import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import type {
  OrderBy,
  SortOrderInput,
  RelationOrderBy,
} from "../../../types/coreTypes";
import { isDict } from "../../other/isDict";
import { isMissingValue } from "../../other/isMissingValue";

type ParsedOrderByEntry = [
  string,
  "asc" | "desc",
  "first" | "last" | undefined,
];

const isSortOrderInput = (
  value: "asc" | "desc" | SortOrderInput | RelationOrderBy,
): value is SortOrderInput => {
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn は ES2022 のため target ES2019 ではコンパイルできない
  return isDict(value) && Object.prototype.hasOwnProperty.call(value, "sort");
};

const isScalarDirection = (
  value: "asc" | "desc" | SortOrderInput | RelationOrderBy,
): value is "asc" | "desc" => {
  return value === "asc" || value === "desc";
};

const SORT_INPUT_KEYS = ["sort", "nulls"];

const parseOrderByEntry = (option: OrderBy): ParsedOrderByEntry => {
  const [key, value] = Object.entries(option)[0];
  if (isSortOrderInput(value)) {
    Object.keys(value).forEach((inputKey) => {
      if (!SORT_INPUT_KEYS.includes(inputKey)) {
        throw new GassmaUnknownArgumentError(inputKey, SORT_INPUT_KEYS);
      }
    });
    if (!isScalarDirection(value.sort)) {
      throw new GassmaInvalidValueError("sort", '"asc" | "desc"');
    }
    if (
      value.nulls !== undefined &&
      value.nulls !== "first" &&
      value.nulls !== "last"
    ) {
      throw new GassmaInvalidValueError("nulls", '"first" | "last"');
    }
    return [key, value.sort, value.nulls];
  }
  if (isScalarDirection(value)) {
    return [key, value, undefined];
  }
  if (isDict(value)) {
    const innerKey = Object.keys(value)[0];
    if (innerKey !== undefined) {
      throw new GassmaUnknownArgumentError(innerKey, SORT_INPUT_KEYS);
    }
  }
  throw new GassmaInvalidValueError("orderBy", '"asc" | "desc"');
};

const search = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  keys: ParsedOrderByEntry[],
  cnt: number = 0,
): number => {
  const [key, ascOrDesc, nulls] = keys[cnt];
  const aVal = a[key];
  const bVal = b[key];

  const aIsNull = isMissingValue(aVal);
  const bIsNull = isMissingValue(bVal);

  if (aIsNull && bIsNull) {
    if (cnt === keys.length - 1) return 0;
    return search(a, b, keys, cnt + 1);
  }

  if (aIsNull) {
    if (nulls === "first") return -1;
    if (nulls === "last") return 1;
    return ascOrDesc === "asc" ? -1 : 1;
  }

  if (bIsNull) {
    if (nulls === "first") return 1;
    if (nulls === "last") return -1;
    return ascOrDesc === "asc" ? 1 : -1;
  }

  if (
    (ascOrDesc === "asc" && aVal > bVal) ||
    (ascOrDesc === "desc" && aVal < bVal)
  )
    return 1;
  if (
    (ascOrDesc === "asc" && aVal < bVal) ||
    (ascOrDesc === "desc" && aVal > bVal)
  )
    return -1;

  if (cnt === keys.length - 1) return 0;
  return search(a, b, keys, cnt + 1);
};

const orderByFunc = (
  result: Record<string, unknown>[],
  orderByOptions: OrderBy[],
) => {
  if (orderByOptions.length === 0) return result;

  const orderByOptionArray = orderByOptions.map(parseOrderByEntry);
  const sortedResult = result.sort((a, b) => search(a, b, orderByOptionArray));
  return sortedResult;
};

export { orderByFunc };
