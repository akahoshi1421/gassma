import type { OrderBy } from "../../../types/coreTypes";

type SeparateResult = {
  scalarOrderBy: OrderBy[];
  relationOrderBy: OrderBy[];
  hasRelationOrderBy: boolean;
};

const isRelationOrderByValue = (value: unknown): boolean => {
  return typeof value === "object" && value !== null && !("sort" in value);
};

const separateRelationOrderBy = (orderByArr: OrderBy[]): SeparateResult => {
  const scalarOrderBy: OrderBy[] = [];
  const relationOrderBy: OrderBy[] = [];

  orderByArr.forEach((entry) => {
    const value = Object.values(entry)[0];
    if (isRelationOrderByValue(value)) {
      relationOrderBy.push(entry);
    } else {
      scalarOrderBy.push(entry);
    }
  });

  return {
    scalarOrderBy,
    relationOrderBy,
    hasRelationOrderBy: relationOrderBy.length > 0,
  };
};

export { separateRelationOrderBy, isRelationOrderByValue };
