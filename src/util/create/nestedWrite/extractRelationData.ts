import type { RelationDefinition } from "../../../types/relationTypes";
import type {
  NestedWriteOperation,
  ExtractedData,
} from "../../../types/nestedWriteTypes";

const NESTED_WRITE_KEYS = [
  "create",
  "createMany",
  "connect",
  "connectOrCreate",
];

const isNestedWriteOperation = (
  value: unknown,
): value is NestedWriteOperation =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).some((key) => NESTED_WRITE_KEYS.includes(key));

const extractRelationData = (
  data: Record<string, unknown>,
  relations: Record<string, RelationDefinition>,
): ExtractedData => {
  const scalarData: Record<string, unknown> = {};
  const relationOps = new Map<string, NestedWriteOperation>();

  Object.entries(data).forEach(([key, value]) => {
    if (key in relations && isNestedWriteOperation(value)) {
      relationOps.set(key, value);
    } else {
      scalarData[key] = value;
    }
  });

  return { scalarData, relationOps };
};

export { extractRelationData, isNestedWriteOperation };
