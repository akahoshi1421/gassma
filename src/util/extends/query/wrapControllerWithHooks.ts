import type { GassmaController } from "../../../gassmaController";
import type { GassmaExtension } from "../../../types/extendsTypes";
import {
  buildHookedOperations,
  type HookedOperations,
} from "./hookedOperations";
import { resolveQueryHooks } from "./resolveQueryHooks";

const wrapControllerWithHooks = (
  controller: GassmaController,
  model: string,
  extensions: GassmaExtension[],
): GassmaController => {
  const operations = buildHookedOperations(controller, model, (operation) =>
    resolveQueryHooks(extensions, model, operation),
  );
  const operationNames = new Set<string>(Object.keys(operations));
  const isHookedOperation = (
    prop: string | symbol,
  ): prop is keyof HookedOperations =>
    typeof prop === "string" && operationNames.has(prop);
  return new Proxy(controller, {
    get: (target, prop, receiver) => {
      if (isHookedOperation(prop)) return operations[prop];
      return Reflect.get(target, prop, receiver);
    },
  });
};

export { wrapControllerWithHooks };
