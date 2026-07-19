import type {
  GassmaExtension,
  ResultFieldRecord,
} from "../../../types/extendsTypes";

const resolveResultFields = (
  extensions: GassmaExtension[],
  model: string,
): ResultFieldRecord => {
  const merged: ResultFieldRecord = {};
  const mergeFrom = (fields: ResultFieldRecord | undefined) => {
    if (!fields) return;
    Object.keys(fields).forEach((field) => {
      merged[field] = fields[field];
    });
  };
  extensions.forEach((extension) => {
    const config = extension.result;
    if (!config) return;
    mergeFrom(config.$allModels);
    if (model !== "$allModels") mergeFrom(config[model]);
  });
  return merged;
};

export { resolveResultFields };
