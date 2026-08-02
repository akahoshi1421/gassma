import type { CountAggregateSelect } from "../../types/countType";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { validateAggregateSelect } from "./validateAggregateSelect";

const buildValidatedAggregateSelect = (
  gassmaControllerUtil: GassmaControllerUtil,
  select: CountAggregateSelect,
  extraKeys: string[],
): Record<string, true> => {
  const titles = getTitle(gassmaControllerUtil);
  const ignoredFields =
    gassmaControllerUtil.whereValidation?.ignoredFields ?? [];
  const truthyKeys = validateAggregateSelect(
    select,
    titles,
    ignoredFields,
    extraKeys,
  );

  const truthySelect: Record<string, true> = {};
  truthyKeys.forEach((key) => {
    truthySelect[key] = true;
  });

  return truthySelect;
};

const buildValidatedCountSelect = (
  gassmaControllerUtil: GassmaControllerUtil,
  select: CountAggregateSelect,
): Record<string, true> =>
  buildValidatedAggregateSelect(gassmaControllerUtil, select, ["_all"]);

const buildValidatedFieldSelect = (
  gassmaControllerUtil: GassmaControllerUtil,
  select: CountAggregateSelect,
): Record<string, true> =>
  buildValidatedAggregateSelect(gassmaControllerUtil, select, []);

export { buildValidatedCountSelect, buildValidatedFieldSelect };
