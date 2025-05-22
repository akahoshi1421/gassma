import { GassmaValidationErrror } from "../../errors/validation/validationError";
import { SchemaType } from "../../types/core/schemaType";
import { AnyUse } from "../../types/coreTypes";

const createValidation = (validation: AnyUse, schema: SchemaType) => {
  if (!schema) return;

  Object.keys(validation).forEach((key) => {
    const oneSchema = schema.shape[key];
    if (!oneSchema) throw new GassmaValidationErrror(key);
  });
  schema.parse(validation);
};

export { createValidation };
