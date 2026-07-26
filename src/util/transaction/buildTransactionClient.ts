import { GassmaNestedTransactionError } from "../../errors/transaction/transactionError";
import type { GassmaController } from "../../gassmaController";
import type { GassmaExtension } from "../../types/extendsTypes";
import type { GassmaSheet } from "../../types/gassmaTypes";
import type { GassmaTransactionClient } from "../../types/transactionTypes";
import { buildExtendedClient } from "../extends/buildExtendedClient";

const wrapControllerWithDeadline = (
  controller: GassmaController,
  checkDeadline: () => void,
): GassmaController =>
  new Proxy(controller, {
    get: (target, prop, receiver) => {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        checkDeadline();
        return value.apply(target, args);
      };
    },
  });

const buildTransactionClient = (
  baseClient: object,
  checkDeadline: () => void,
): GassmaTransactionClient => {
  const controllers: GassmaSheet = {};
  Object.entries(baseClient).forEach(([sheetName, value]) => {
    if (value && typeof value.findMany === "function") {
      controllers[sheetName] = wrapControllerWithDeadline(value, checkDeadline);
    }
  });
  const core = {
    $extends: (extension: GassmaExtension) =>
      buildExtendedClient(controllers, [extension]),
    $transaction: () => {
      throw new GassmaNestedTransactionError();
    },
  };
  const client: GassmaTransactionClient = Object.assign(
    Object.create(core),
    controllers,
  );
  return client;
};

export { buildTransactionClient };
