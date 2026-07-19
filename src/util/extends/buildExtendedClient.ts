import type {
  ExtendedClientCore,
  ExtendedGassmaClient,
  GassmaExtension,
} from "../../types/extendsTypes";
import type { GassmaSheet } from "../../types/gassmaTypes";
import { wrapControllerWithHooks } from "./query/wrapControllerWithHooks";

const buildExtendedClient = (
  baseControllers: GassmaSheet,
  extensions: GassmaExtension[],
): ExtendedGassmaClient => {
  const wrapped: GassmaSheet = {};
  Object.keys(baseControllers).forEach((model) => {
    wrapped[model] = wrapControllerWithHooks(
      baseControllers[model],
      model,
      extensions,
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
