import type { AnyUse, OrderBy } from "../../../types/coreTypes";

const search = (
  a: AnyUse,
  b: AnyUse,
  keys: [string, "asc" | "desc"][],
  cnt: number = 0
) => {
  const key = keys[cnt][0];
  const ascOrDesc = keys[cnt][1];

  if (
    (ascOrDesc === "asc" && a[key] > b[key]) ||
    (ascOrDesc === "desc" && a[key] < b[key])
  )
    return 1;
  if (
    (ascOrDesc === "asc" && a[key] < b[key]) ||
    (ascOrDesc === "desc" && a[key] > b[key])
  )
    return -1;

  if (cnt === keys.length - 1) return 1;
  return search(a, b, keys, cnt + 1);
};

const orderByFunc = (result: {}[], orderByOptions: OrderBy[]) => {
  const orderByOptionArray = orderByOptions.map((option) => {
    return Object.entries(option)[0];
  });

  const sortedResult = result.sort((a, b) => search(a, b, orderByOptionArray));

  return sortedResult;
};

export { orderByFunc };
