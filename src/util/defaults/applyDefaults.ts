import type { GassmaAny } from "../../types/coreTypes";

type DefaultValue = GassmaAny | (() => GassmaAny);

type DefaultsForSheet = {
  [columnName: string]: DefaultValue;
};

const applyDefaults = (
  data: Record<string, unknown>,
  defaults: DefaultsForSheet,
): Record<string, unknown> => {
  const result = { ...data };

  Object.keys(defaults).forEach((key) => {
    if (key in result) return;
    const defaultValue = defaults[key];
    result[key] =
      typeof defaultValue === "function" ? defaultValue() : defaultValue;
  });

  return result;
};

export { applyDefaults };
export type { DefaultValue, DefaultsForSheet };
