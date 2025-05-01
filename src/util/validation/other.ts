import { GassmaValidationErrror } from "../../errors/validation/validationError";
import { SchemaType } from "../../types/core/schemaType";
import { WhereUse } from "../../types/coreTypes";
import { isDict } from "../other/isDict";

const otherValidation = (validation: WhereUse, schema: SchemaType) => {
  if (!schema) return;

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

export { otherValidation };
