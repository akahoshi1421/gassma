import type { ResultFieldRecord } from "../../../types/extendsTypes";
import { isRecordValue } from "./isRecordValue";
import { prepareResultArgs, type ResultPlan } from "./prepareResultArgs";

type ResultTreeContext = {
  fieldsFor: (model: string) => ResultFieldRecord;
  relationTargets: (model: string) => { [relationName: string]: string };
};

type ResultTreeNode = {
  fields: ResultFieldRecord;
  plan: ResultPlan;
  children: { [key: string]: ResultTreeNode };
};

type PreparedResultTree = { args: any; node: ResultTreeNode };

const isTrivialNode = (node: ResultTreeNode): boolean =>
  node.plan.kind === "all" &&
  Object.keys(node.fields).length === 0 &&
  Object.keys(node.children).length === 0;

const prepareResultTree = (
  model: string,
  args: any,
  ctx: ResultTreeContext,
): PreparedResultTree => {
  const fields = ctx.fieldsFor(model);
  const prepared = prepareResultArgs(args, fields);
  const targets = ctx.relationTargets(model);
  const children: { [key: string]: ResultTreeNode } = {};
  let nextArgs = prepared.args;

  const visitEntry = (
    adjusted: Record<string, unknown>,
    key: string,
    value: unknown,
  ) => {
    const target = targets[key];
    if (!target) return;
    if (value !== true && !isRecordValue(value)) return;
    const sub = prepareResultTree(target, value === true ? {} : value, ctx);
    if (value !== true) adjusted[key] = sub.args;
    if (!isTrivialNode(sub.node)) children[key] = sub.node;
  };

  const adjustContainer = (container: "include" | "select") => {
    const source: unknown = nextArgs?.[container];
    if (!isRecordValue(source)) return;
    const adjusted: Record<string, unknown> = { ...source };
    Object.keys(source).forEach((key) => {
      visitEntry(adjusted, key, source[key]);
    });
    nextArgs = { ...nextArgs, [container]: adjusted };
  };

  adjustContainer("include");
  adjustContainer("select");

  return { args: nextArgs, node: { fields, plan: prepared.plan, children } };
};

export { prepareResultTree };
export type { PreparedResultTree, ResultTreeContext, ResultTreeNode };
