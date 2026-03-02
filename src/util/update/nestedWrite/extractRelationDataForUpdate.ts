import type { RelationDefinition } from "../../../types/relationTypes";
import type {
  NestedWriteOperation,
  ExtractedData,
} from "../../../types/nestedWriteTypes";

const UPDATE_NESTED_WRITE_KEYS = [
  "create",
  "createMany",
  "connect",
  "connectOrCreate",
  "update",
  "delete",
  "deleteMany",
];

const isUpdateNestedWriteOperation = (
  value: unknown,
): value is NestedWriteOperation =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).some((key) => UPDATE_NESTED_WRITE_KEYS.includes(key));

const extractRelationDataForUpdate = (
  data: Record<string, unknown>,
  relations: Record<string, RelationDefinition>,
): ExtractedData => {
  const scalarData: Record<string, unknown> = {};
  const relationOps = new Map<string, NestedWriteOperation>();

  Object.entries(data).forEach(([key, value]) => {
    if (key in relations && isUpdateNestedWriteOperation(value)) {
      relationOps.set(key, value);
    } else {
      scalarData[key] = value;
    }
  });

  return { scalarData, relationOps };
};

export { extractRelationDataForUpdate, isUpdateNestedWriteOperation };
