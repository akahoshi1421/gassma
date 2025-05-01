import { GassmaValidationErrror } from "../../errors/validation/validationError";
import { SchemaType } from "../../types/core/schemaType";
import { AnyUse } from "../../types/coreTypes";
import { isDict } from "../other/isDict";

const otherCreateValidation = (validation: AnyUse, schema: SchemaType) => {
  Object.keys(validation).forEach((key) => {
    if (key === "AND" || key === "OR" || key === "NOT") return;

    const value = validation[key];

    const oneSchema = schema.shape[key];
    if (!oneSchema) throw new GassmaValidationErrror(key);

    if (isDict(value)) {
      return Object.keys(value).forEach((filterConditionsKey) => {
        oneSchema.parse(value[filterConditionsKey]);
      });
    }

    oneSchema.parse(validation[key]);
  });
};

export { otherCreateValidation };
