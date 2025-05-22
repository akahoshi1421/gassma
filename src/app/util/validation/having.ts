import { GassmaValidationErrror } from "../../errors/validation/validationError";
import { SchemaType } from "../../types/core/schemaType";
import { FilterConditions, HavingCore, HavingUse } from "../../types/coreTypes";
import { isDict } from "../other/isDict";

const havingValidation = (validation: HavingUse, schema: SchemaType) => {
  if (!schema) return;

  Object.keys(validation).forEach((key) => {
    if (key === "AND" || key === "OR" || key === "NOT") return;

    const value = validation[key];
    const oneSchema = schema.shape[key];

    if (!oneSchema) throw new GassmaValidationErrror(key);

    // そのまま値が入っている場合
    if (!isDict(value)) {
      oneSchema.parse(value);
      return;
    }

    Object.keys(value as HavingCore).forEach(
      (aggregateOrFilterConditionsKey) => {
        // 統計系の値が入っている場合
        if (
          aggregateOrFilterConditionsKey === "_avg" ||
          aggregateOrFilterConditionsKey === "_sum" ||
          aggregateOrFilterConditionsKey === "_count" ||
          aggregateOrFilterConditionsKey === "_min" ||
          aggregateOrFilterConditionsKey === "_max"
        ) {
          const aggreagteValue = value[
            aggregateOrFilterConditionsKey
          ] as FilterConditions;

          return Object.keys(aggreagteValue).forEach((filterConditionsKey) =>
            oneSchema.parse(aggreagteValue[filterConditionsKey])
          );
        }

        // FilterConditionsが直下にある場合
        oneSchema.parse(value[aggregateOrFilterConditionsKey]);
      }
    );
  });
};

export { havingValidation };
