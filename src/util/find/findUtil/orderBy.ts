import type { OrderBy, SortOrderInput } from "../../../types/coreTypes";

type ParsedOrderByEntry = [
  string,
  "asc" | "desc",
  "first" | "last" | undefined,
];

const isSortOrderInput = (
  value: "asc" | "desc" | SortOrderInput,
): value is SortOrderInput => {
  return typeof value === "object" && value !== null && "sort" in value;
};

const parseOrderByEntry = (option: OrderBy): ParsedOrderByEntry => {
  const [key, value] = Object.entries(option)[0];
  if (isSortOrderInput(value)) {
    return [key, value.sort, value.nulls];
  }
  return [key, value, undefined];
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

  const aIsNull = aVal === null || aVal === undefined;
  const bIsNull = bVal === null || bVal === undefined;

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
  const orderByOptionArray = orderByOptions.map(parseOrderByEntry);
  const sortedResult = result.sort((a, b) => search(a, b, orderByOptionArray));
  return sortedResult;
};

export { orderByFunc };
