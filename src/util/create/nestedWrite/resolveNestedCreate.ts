import type { RelationContext } from "../../../types/relationTypes";
import type { WhereValidation } from "../../../types/gassmaControllerUtilType";
import { NestedWriteWithoutRelationsError } from "../../../errors/relation/nestedWriteError";
import { validateDataColumns } from "../../validate/validateDataColumns";
import {
  extractRelationData,
  isNestedWriteOperation,
} from "./extractRelationData";
import { processBeforeCreate } from "./processBeforeCreate";
import { processAfterCreate } from "./processAfterCreate";
import { processOneToOne } from "./processOneToOne";
import { processManyToMany } from "./processManyToMany";

type CreateExecutor = (
  data: Record<string, unknown>,
  titles?: string[],
) => Record<string, unknown>;

type NestedCreateDeps = {
  getTitles: () => string[];
  validation?: WhereValidation;
  prepare?: (data: Record<string, unknown>) => Record<string, unknown>;
};

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
  createFunc: CreateExecutor,
  relationContext: RelationContext | undefined,
  deps?: NestedCreateDeps,
): Record<string, unknown> => {
  const titles = deps ? deps.getTitles() : undefined;
  const validate = (target: Record<string, unknown>) => {
    if (!deps?.validation || !titles) return;
    validateDataColumns(target, titles, deps.validation, "create");
  };
  const prepare = (target: Record<string, unknown>) =>
    deps?.prepare ? deps.prepare(target) : target;
  const exec = (target: Record<string, unknown>) =>
    titles === undefined ? createFunc(target) : createFunc(target, titles);

  if (!relationContext || !hasNestedWriteFields(data, relationContext)) {
    if (!relationContext && Object.values(data).some(isNestedWriteOperation)) {
      throw new NestedWriteWithoutRelationsError();
    }
    validate(data);
    return exec(prepare(data));
  }

  const { scalarData, relationOps } = extractRelationData(
    data,
    relationContext.relations,
  );

  validate(scalarData);

  const enrichedData = processBeforeCreate(
    prepare(scalarData),
    relationOps,
    relationContext,
  );

  const createdRecord = exec(enrichedData);

  processAfterCreate(createdRecord, relationOps, relationContext);
  processOneToOne(createdRecord, relationOps, relationContext);
  processManyToMany(createdRecord, relationOps, relationContext);

  return createdRecord;
};

export { resolveNestedCreate };
export type { NestedCreateDeps };
