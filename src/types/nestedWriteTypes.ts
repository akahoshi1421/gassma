import type { AnyUse, WhereUse } from "./coreTypes";

type ConnectOrCreateInput = {
  where: WhereUse;
  create: Record<string, unknown>;
};

type NestedUpdateInput = {
  where: WhereUse;
  data: Record<string, unknown>;
};

type NestedWriteOperation = {
  create?: Record<string, unknown> | Record<string, unknown>[];
  createMany?: { data: AnyUse[] };
  connect?: WhereUse | WhereUse[];
  connectOrCreate?: ConnectOrCreateInput | ConnectOrCreateInput[];
  update?: Record<string, unknown> | NestedUpdateInput | NestedUpdateInput[];
  delete?: boolean | WhereUse | WhereUse[];
  deleteMany?: WhereUse | WhereUse[];
  disconnect?: boolean | WhereUse | WhereUse[];
  set?: WhereUse[];
};

type ExtractedData = {
  scalarData: Record<string, unknown>;
  relationOps: Map<string, NestedWriteOperation>;
};

export type {
  ConnectOrCreateInput,
  NestedUpdateInput,
  NestedWriteOperation,
  ExtractedData,
};
