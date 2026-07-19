import type {
  GassmaExtension,
  ResultFieldRecord,
} from "../../../types/extendsTypes";

const resolveResultFields = (
  extensions: GassmaExtension[],
  model: string,
): ResultFieldRecord => {
  const merged: ResultFieldRecord = {};
  extensions.forEach((extension) => {
    const config = extension.result;
    if (!config || !config[model]) return;
    Object.keys(config[model]).forEach((field) => {
      merged[field] = config[model][field];
    });
  });
  return merged;
};

export { resolveResultFields };
