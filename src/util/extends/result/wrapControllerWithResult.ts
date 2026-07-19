import type { GassmaController } from "../../../gassmaController";
import type {
  GassmaExtension,
  ResultFieldRecord,
} from "../../../types/extendsTypes";
import type { ResultTreeContext } from "./prepareResultTree";
import { resolveResultFields } from "./resolveResultFields";
import {
  buildResultOperations,
  type ResultOperations,
} from "./resultOperations";

const hasResultConfig = (extensions: GassmaExtension[]): boolean =>
  extensions.some(
    (extension) =>
      extension.result !== undefined &&
      Object.keys(extension.result).length > 0,
  );

const buildFieldsResolver = (
  extensions: GassmaExtension[],
): ResultTreeContext["fieldsFor"] => {
  const cache = new Map<string, ResultFieldRecord>();
  return (model) => {
    const cached = cache.get(model);
    if (cached) return cached;
    const resolved = resolveResultFields(extensions, model);
    cache.set(model, resolved);
    return resolved;
  };
};

const wrapControllerWithResult = (
  controller: GassmaController,
  model: string,
  extensions: GassmaExtension[],
  relationTargets: ResultTreeContext["relationTargets"],
): GassmaController => {
  if (!hasResultConfig(extensions)) return controller;
  const ctx: ResultTreeContext = {
    fieldsFor: buildFieldsResolver(extensions),
    relationTargets,
  };
  const operations = buildResultOperations(controller, model, ctx);
  const operationNames = new Set<string>(Object.keys(operations));
  const isResultOperation = (
    prop: string | symbol,
  ): prop is keyof ResultOperations =>
    typeof prop === "string" && operationNames.has(prop);
  return new Proxy(controller, {
    get: (target, prop, receiver) => {
      if (isResultOperation(prop)) return operations[prop];
      return Reflect.get(target, prop, receiver);
    },
  });
};

export { wrapControllerWithResult };
