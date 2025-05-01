import { SchemaType } from "../../types/core/schemaType";
import { AnyUse } from "../../types/coreTypes";

const createValidation = (validation: AnyUse, schema: SchemaType) =>
  schema.parse(validation);

export { createValidation };
