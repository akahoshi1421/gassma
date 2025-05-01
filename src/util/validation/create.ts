import { SchemaType } from "../../types/core/schemaType";
import { AnyUse } from "../../types/coreTypes";

const createValidation = (validation: AnyUse, schema: SchemaType) => {
  if (!schema) return;
  schema.parse(validation);
};

export { createValidation };
