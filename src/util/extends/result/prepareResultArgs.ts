import type { ResultFieldRecord } from "../../../types/extendsTypes";
import { collectNeededKeys, collectRelevantFields } from "./collectResultKeys";
import { hasOwnKey } from "./hasOwnKey";
import { isRecordValue } from "./isRecordValue";

type ResultPlan =
  | { kind: "all" }
  | { kind: "select"; selectKeys: string[]; relevant: string[] }
  | { kind: "omit"; dropKeys: string[] };

type PreparedResultArgs = { args: any; plan: ResultPlan };

const prepareSelect = (
  args: any,
  select: Record<string, unknown>,
  fields: ResultFieldRecord,
): PreparedResultArgs => {
  const selected = Object.keys(fields).filter((name) =>
    hasOwnKey(select, name),
  );
  const relevant = collectRelevantFields(fields, selected);
  const needed = collectNeededKeys(fields, relevant);
  const adjusted: Record<string, unknown> = { ...select };
  selected.forEach((name) => {
    delete adjusted[name];
  });
  needed.forEach((key) => {
    if (!hasOwnKey(adjusted, key)) adjusted[key] = true;
  });
  return {
    args: { ...args, select: adjusted },
    plan: { kind: "select", selectKeys: Object.keys(select), relevant },
  };
};

const prepareOmit = (
  args: any,
  omit: Record<string, unknown>,
  fields: ResultFieldRecord,
): PreparedResultArgs => {
  const needed = collectNeededKeys(fields, Object.keys(fields));
  const adjusted: Record<string, unknown> = { ...omit };
  const dropKeys: string[] = [];
  needed.forEach((key) => {
    if (!hasOwnKey(adjusted, key) || !adjusted[key]) return;
    delete adjusted[key];
    dropKeys.push(key);
  });
  Object.keys(fields).forEach((name) => {
    if (hasOwnKey(omit, name) && omit[name]) dropKeys.push(name);
  });
  return {
    args: { ...args, omit: adjusted },
    plan: { kind: "omit", dropKeys },
  };
};

const prepareResultArgs = (
  args: any,
  fields: ResultFieldRecord,
): PreparedResultArgs => {
  const select = isRecordValue(args?.select) ? args.select : null;
  const omit = isRecordValue(args?.omit) ? args.omit : null;
  if (select && omit) return { args, plan: { kind: "all" } };
  if (select) return prepareSelect(args, select, fields);
  if (omit) return prepareOmit(args, omit, fields);
  return { args, plan: { kind: "all" } };
};

export { prepareResultArgs };
export type { PreparedResultArgs, ResultPlan };
