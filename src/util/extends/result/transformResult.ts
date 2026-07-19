import type { ResultFieldRecord } from "../../../types/extendsTypes";
import { applyResultComputation } from "./applyResultComputation";
import { isRecordValue } from "./isRecordValue";
import type { ResultPlan } from "./prepareResultArgs";

const pickFields = (
  fields: ResultFieldRecord,
  names: string[],
): ResultFieldRecord => {
  const picked: ResultFieldRecord = {};
  names.forEach((name) => {
    picked[name] = fields[name];
  });
  return picked;
};

const shapeRecord = (
  record: Record<string, unknown>,
  fields: ResultFieldRecord,
  plan: ResultPlan,
): Record<string, unknown> => {
  if (plan.kind === "select") {
    const enriched = applyResultComputation(
      record,
      pickFields(fields, plan.relevant),
    );
    const shaped: Record<string, unknown> = {};
    plan.selectKeys.forEach((key) => {
      shaped[key] = enriched[key];
    });
    return shaped;
  }
  const enriched = applyResultComputation(record, fields);
  if (plan.kind === "omit") {
    plan.dropKeys.forEach((key) => {
      delete enriched[key];
    });
  }
  return enriched;
};

const transformResult = (
  raw: any,
  fields: ResultFieldRecord,
  plan: ResultPlan,
): any => {
  if (Array.isArray(raw)) {
    return raw.map((record) => transformResult(record, fields, plan));
  }
  if (isRecordValue(raw)) {
    return shapeRecord(raw, fields, plan);
  }
  return raw;
};

export { transformResult };
