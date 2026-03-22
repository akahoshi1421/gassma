import type { IncludeData } from "../../types/relationTypes";

type ProcessedSelect = {
  scalarSelect: Record<string, unknown> | null;
  nestedInclude: IncludeData | null;
};

const processSelectForInclude = (
  select: Record<string, unknown>,
): ProcessedSelect => {
  const scalar: Record<string, unknown> = {};
  const nested: IncludeData = {};

  Object.keys(select).forEach((key) => {
    if (key === "_count") return;
    const value = select[key];
    if (value === true) {
      scalar[key] = true;
    } else if (typeof value === "object" && value !== null) {
      nested[key] = value as IncludeData[string];
    }
  });

  return {
    scalarSelect: Object.keys(scalar).length > 0 ? scalar : null,
    nestedInclude: Object.keys(nested).length > 0 ? nested : null,
  };
};

export { processSelectForInclude };
export type { ProcessedSelect };
