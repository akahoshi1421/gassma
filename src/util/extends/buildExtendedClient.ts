import type {
  ExtendedClientCore,
  ExtendedGassmaClient,
  GassmaExtension,
} from "../../types/extendsTypes";
import type { GassmaSheet } from "../../types/gassmaTypes";
import { wrapControllerWithHooks } from "./query/wrapControllerWithHooks";
import { resolveResultFields } from "./result/resolveResultFields";
import { wrapControllerWithResult } from "./result/wrapControllerWithResult";

const buildExtendedClient = (
  baseControllers: GassmaSheet,
  extensions: GassmaExtension[],
): ExtendedGassmaClient => {
  const wrapped: GassmaSheet = {};
  Object.keys(baseControllers).forEach((model) => {
    const hooked = wrapControllerWithHooks(
      baseControllers[model],
      model,
      extensions,
    );
    wrapped[model] = wrapControllerWithResult(
      hooked,
      resolveResultFields(extensions, model),
    );
  });
  const core: ExtendedClientCore = {
    $extends: (extension) =>
      buildExtendedClient(baseControllers, extensions.concat(extension)),
  };
  const client: ExtendedGassmaClient = Object.assign(
    Object.create(core),
    wrapped,
  );
  return client;
};

export { buildExtendedClient };
