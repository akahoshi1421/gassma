import type { ResultFieldRecord } from "../../../types/extendsTypes";
import { hasOwnKey } from "./hasOwnKey";

const applyResultComputation = (
  record: Record<string, unknown>,
  fields: ResultFieldRecord,
): Record<string, unknown> => {
  const enriched: Record<string, unknown> = { ...record };
  const done = new Set<string>();
  const visiting = new Set<string>();
  const computeField = (name: string) => {
    if (done.has(name) || visiting.has(name)) return;
    visiting.add(name);
    const needs = fields[name].needs;
    if (needs) {
      Object.keys(needs).forEach((dep) => {
        if (needs[dep] && hasOwnKey(fields, dep)) computeField(dep);
      });
    }
    enriched[name] = fields[name].compute(enriched);
    visiting.delete(name);
    done.add(name);
  };
  Object.keys(fields).forEach(computeField);
  return enriched;
};

export { applyResultComputation };
