import type { RelationContext } from "../../../types/relationTypes";
import { NestedWriteWithoutRelationsError } from "../../../errors/relation/nestedWriteError";
import {
  extractRelationData,
  isNestedWriteOperation,
} from "./extractRelationData";
import { processBeforeCreate } from "./processBeforeCreate";
import { processAfterCreate } from "./processAfterCreate";
import { processManyToMany } from "./processManyToMany";

const hasNestedWriteFields = (
  data: Record<string, unknown>,
  relationContext: RelationContext | undefined,
): boolean => {
  if (!relationContext) return false;
  return Object.entries(data).some(
    ([key, value]) =>
      key in relationContext.relations && isNestedWriteOperation(value),
  );
};

const resolveNestedCreate = (
  data: Record<string, unknown>,
  createFunc: (scalarData: Record<string, unknown>) => Record<string, unknown>,
  relationContext: RelationContext | undefined,
): Record<string, unknown> => {
  if (!hasNestedWriteFields(data, relationContext)) {
    if (!relationContext && Object.values(data).some(isNestedWriteOperation)) {
      throw new NestedWriteWithoutRelationsError();
    }
    return createFunc(data);
  }

  const { scalarData, relationOps } = extractRelationData(
    data,
    relationContext!.relations,
  );

  const enrichedData = processBeforeCreate(
    scalarData,
    relationOps,
    relationContext!,
  );

  const createdRecord = createFunc(enrichedData);

  processAfterCreate(createdRecord, relationOps, relationContext!);
  processManyToMany(createdRecord, relationOps, relationContext!);

  return createdRecord;
};

export { resolveNestedCreate };
