import type { AnyUse, WhereUse } from "./coreTypes";

type ConnectOrCreateInput = {
  where: WhereUse;
  create: Record<string, unknown>;
};

type NestedWriteOperation = {
  create?: Record<string, unknown> | Record<string, unknown>[];
  createMany?: { data: AnyUse[] };
  connect?: WhereUse | WhereUse[];
  connectOrCreate?: ConnectOrCreateInput | ConnectOrCreateInput[];
};

type ExtractedData = {
  scalarData: Record<string, unknown>;
  relationOps: Map<string, NestedWriteOperation>;
};

export type { ConnectOrCreateInput, NestedWriteOperation, ExtractedData };
