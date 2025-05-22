import { GassmaValidationErrror } from "../../errors/validation/validationError";
import { SchemaType } from "../../types/core/schemaType";
import { AnyUse } from "../../types/coreTypes";

const updateDataValidation = (validation: AnyUse, schema: SchemaType) => {
  if (!schema) return;

  Object.keys(validation).forEach((key) => {
    const value = validation[key];
    const oneSchema = schema.shape[key];
    if (!oneSchema) throw new GassmaValidationErrror(key);

    oneSchema.parse(value);
  });
};

export { updateDataValidation };
