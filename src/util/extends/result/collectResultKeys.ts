import type { ResultFieldRecord } from "../../../types/extendsTypes";
import { hasOwnKey } from "./hasOwnKey";

const collectRelevantFields = (
  fields: ResultFieldRecord,
  selected: string[],
): string[] => {
  const relevant: string[] = [];
  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name) || !hasOwnKey(fields, name)) return;
    seen.add(name);
    relevant.push(name);
    const needs = fields[name].needs;
    if (!needs) return;
    Object.keys(needs).forEach((dep) => {
      if (needs[dep]) visit(dep);
    });
  };
  selected.forEach(visit);
  return relevant;
};

const collectNeededKeys = (
  fields: ResultFieldRecord,
  names: string[],
): string[] => {
  const keys: string[] = [];
  const seen = new Set<string>();
  names.forEach((name) => {
    const needs = fields[name].needs;
    if (!needs) return;
    Object.keys(needs).forEach((key) => {
      if (!needs[key] || seen.has(key)) return;
      seen.add(key);
      keys.push(key);
    });
  });
  return keys;
};

export { collectNeededKeys, collectRelevantFields };
