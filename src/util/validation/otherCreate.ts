import { GassmaValidationErrror } from "../../errors/validation/validationError";
import { SchemaType } from "../../types/core/schemaType";
import { AnyUse } from "../../types/coreTypes";

const otherCreateValidation = (validation: AnyUse, schema: SchemaType) => {
  Object.keys(validation).forEach((key) => {
    const oneSchema = schema.shape[key];
    if (!oneSchema) throw new GassmaValidationErrror(key);

    oneSchema.parse(validation[key]);
  });
};

export { otherCreateValidation };
