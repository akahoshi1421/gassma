import type { CountAggregateSelect } from "../../types/countType";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { validateCountSelect } from "./validateCountSelect";

const buildValidatedCountSelect = (
  gassmaControllerUtil: GassmaControllerUtil,
  select: CountAggregateSelect,
): Record<string, true> => {
  const titles = getTitle(gassmaControllerUtil);
  const ignoredFields =
    gassmaControllerUtil.whereValidation?.ignoredFields ?? [];
  const truthyKeys = validateCountSelect(select, titles, ignoredFields);

  const truthySelect: Record<string, true> = {};
  truthyKeys.forEach((key) => {
    truthySelect[key] = true;
  });

  return truthySelect;
};

export { buildValidatedCountSelect };
