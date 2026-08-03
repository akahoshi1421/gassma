import type { OrderBy } from "../../../types/coreTypes";
import { isDict } from "../../other/isDict";

type SeparateResult = {
  scalarOrderBy: OrderBy[];
  relationOrderBy: OrderBy[];
  hasRelationOrderBy: boolean;
};

const isRelationOrderByValue = (value: unknown): boolean => {
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn は ES2022 のため target ES2019 ではコンパイルできない
  return isDict(value) && !Object.prototype.hasOwnProperty.call(value, "sort");
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
