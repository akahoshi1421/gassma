import type { CountData } from "../../types/countType";
import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getCount } from "../aggregate/aggregateUtil/count";
import { findManyFunc } from "../find/findMany";
import { buildValidatedCountSelect } from "../validate/buildValidatedCountSelect";

const countFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  countData: CountData,
) => {
  const { select, ...rest } = countData;
  const findData: FindData = { ...rest };

  const rows = findManyFunc(gassmaControllerUtil, findData);

  if (select === undefined || select === true) return rows.length;

  const truthySelect = buildValidatedCountSelect(gassmaControllerUtil, select);

  return getCount(rows, truthySelect);
};

export { countFunc };
