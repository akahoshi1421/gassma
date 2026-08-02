import type {
  RelationContext,
  RelationDefinition,
} from "../../types/relationTypes";
import { isDateValue } from "../other/isDateValue";
import { isDict } from "../other/isDict";
import { isRawValue } from "../raw/raw";

type UpsertBranches = { create?: unknown; update?: unknown };

const isNestedWriteValue = (value: unknown): boolean =>
  isDict(value) && !isDateValue(value) && !isRawValue(value);

const hasNestedWrite = (
  data: unknown,
  relations: { [relationName: string]: RelationDefinition },
): boolean => {
  if (!isDict(data)) return false;
  const relationNames = Object.keys(relations);
  return Object.entries(data).some(
    ([key, value]) => relationNames.includes(key) && isNestedWriteValue(value),
  );
};

const writesToOtherSheet = (
  relation: RelationDefinition,
  action: "Cascade" | "SetNull" | "Restrict" | "NoAction" | undefined,
): boolean => {
  if (relation.type === "manyToOne") return false;
  if (action === "Cascade") return true;
  return action === "SetNull" && relation.type !== "manyToMany";
};

const touchesCascadeField = (
  context: RelationContext,
  data: unknown,
): boolean => {
  if (!isDict(data)) return false;
  const dataKeys = Object.keys(data);
  return Object.values(context.relations).some(
    (relation) =>
      writesToOtherSheet(relation, relation.onUpdate) &&
      dataKeys.includes(relation.field),
  );
};

const shouldBufferCreate = (
  context: RelationContext | null,
  data: unknown,
): boolean => context !== null && hasNestedWrite(data, context.relations);

const shouldBufferUpdateMany = (
  context: RelationContext | null,
  data: unknown,
): boolean => context !== null && touchesCascadeField(context, data);

const shouldBufferUpdate = (
  context: RelationContext | null,
  data: unknown,
): boolean =>
  shouldBufferCreate(context, data) || shouldBufferUpdateMany(context, data);

const shouldBufferDelete = (context: RelationContext | null): boolean =>
  context !== null &&
  Object.values(context.relations).some((relation) =>
    writesToOtherSheet(relation, relation.onDelete),
  );

const shouldBufferUpsert = (
  context: RelationContext | null,
  upsertData: UpsertBranches | undefined,
): boolean =>
  shouldBufferCreate(context, upsertData?.create) ||
  shouldBufferUpdate(context, upsertData?.update);

export {
  shouldBufferCreate,
  shouldBufferDelete,
  shouldBufferUpdate,
  shouldBufferUpdateMany,
  shouldBufferUpsert,
};
