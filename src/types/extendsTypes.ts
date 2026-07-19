import type { GassmaSheet } from "./gassmaTypes";

type QueryHookParams = {
  model: string;
  operation: string;
  args: any;
  query: (args: any) => any;
};

type QueryHook = (params: QueryHookParams) => any;

type QueryHookRecord = {
  [operationName: string]: QueryHook;
};

type QueryExtensionConfig = {
  [modelName: string]: QueryHookRecord;
};

type ResultFieldDefinition = {
  needs?: { [fieldName: string]: boolean };
  compute: (record: any) => any;
};

type ResultFieldRecord = {
  [fieldName: string]: ResultFieldDefinition;
};

type ResultExtensionConfig = {
  [modelName: string]: ResultFieldRecord;
};

type GassmaExtension = {
  query?: QueryExtensionConfig;
  result?: ResultExtensionConfig;
};

type ExtendedClientCore = {
  $extends: (extension: GassmaExtension) => ExtendedGassmaClient;
};

type ExtendedGassmaClient = ExtendedClientCore & GassmaSheet;

export type {
  ExtendedClientCore,
  ExtendedGassmaClient,
  GassmaExtension,
  QueryExtensionConfig,
  QueryHook,
  QueryHookParams,
  QueryHookRecord,
  ResultExtensionConfig,
  ResultFieldDefinition,
  ResultFieldRecord,
};
