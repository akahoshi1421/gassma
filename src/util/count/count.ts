import type { CountData } from "../../types/countType";
import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getCount } from "../aggregate/aggregateUtil/count";
import { getTitle } from "../core/getTitle";
import { findManyFunc } from "../find/findMany";
import { validateCountSelect } from "../validate/validateCountSelect";

const countFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  countData: CountData,
) => {
  const { select, ...rest } = countData;
  const findData: FindData = { ...rest };

  const rows = findManyFunc(gassmaControllerUtil, findData);

  if (select === undefined || select === true) return rows.length;

  const titles = getTitle(gassmaControllerUtil);
  const ignoredFields =
    gassmaControllerUtil.whereValidation?.ignoredFields ?? [];
  const truthyKeys = validateCountSelect(select, titles, ignoredFields);

  const truthySelect: Record<string, true> = {};
  truthyKeys.forEach((key) => {
    truthySelect[key] = true;
  });

  return getCount(rows, truthySelect);
};

export { countFunc };
