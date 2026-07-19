import type {
  GassmaExtension,
  QueryExtensionConfig,
  QueryHook,
  QueryHookRecord,
} from "../../../types/extendsTypes";

const collectFromRecord = (
  record: QueryHookRecord | undefined,
  operation: string,
  result: QueryHook[],
) => {
  if (!record) return;
  if (record[operation]) result.push(record[operation]);
  if (record.$allOperations) result.push(record.$allOperations);
};

const collectFromConfig = (
  config: QueryExtensionConfig | undefined,
  model: string,
  operation: string,
  result: QueryHook[],
) => {
  if (!config) return;
  collectFromRecord(config[model], operation, result);
  collectFromRecord(config.$allModels, operation, result);
};

const resolveQueryHooks = (
  extensions: GassmaExtension[],
  model: string,
  operation: string,
): QueryHook[] => {
  const result: QueryHook[] = [];
  extensions.forEach((extension) => {
    collectFromConfig(extension.query, model, operation, result);
  });
  return result;
};

export { resolveQueryHooks };
