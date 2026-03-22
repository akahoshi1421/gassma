import type { Select } from "../../../types/coreTypes";
import type { IncludeData } from "../../../types/relationTypes";

type ExtractedSelect = {
  scalarSelect: Select | null;
  relationInclude: IncludeData | null;
};

const extractSelectRelations = (
  select: Record<string, unknown>,
  relationNames: string[],
): ExtractedSelect => {
  const scalarSelect: Select = {};
  const relationInclude: IncludeData = {};

  Object.keys(select).forEach((key) => {
    if (key === "_count") return;
    if (relationNames.includes(key)) {
      const value = select[key];
      relationInclude[key] = value === true ? true : value;
      return;
    }
    scalarSelect[key] = true;
  });

  const hasScalar = Object.keys(scalarSelect).length > 0;
  const hasRelations = Object.keys(relationInclude).length > 0;

  return {
    scalarSelect: hasScalar ? scalarSelect : null,
    relationInclude: hasRelations ? relationInclude : null,
  };
};

export { extractSelectRelations };
export type { ExtractedSelect };
