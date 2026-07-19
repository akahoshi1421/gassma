import type { GassmaController } from "../../../gassmaController";
import type { ResultFieldRecord } from "../../../types/extendsTypes";
import {
  buildResultOperations,
  type ResultOperations,
} from "./resultOperations";

const wrapControllerWithResult = (
  controller: GassmaController,
  fields: ResultFieldRecord,
): GassmaController => {
  if (Object.keys(fields).length === 0) return controller;
  const operations = buildResultOperations(controller, fields);
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
