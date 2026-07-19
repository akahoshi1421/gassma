import type { QueryHook } from "../../types/extendsTypes";

const runQueryHooks = <A, R>(
  hooks: QueryHook[],
  model: string,
  operation: string,
  args: A,
  execute: (args: A) => R,
): R => {
  const step = (index: number, currentArgs: A): R => {
    if (index >= hooks.length) return execute(currentArgs);
    return hooks[index]({
      model,
      operation,
      args: currentArgs,
      query: (nextArgs: A) => step(index + 1, nextArgs),
    });
  };
  return step(0, args);
};

export { runQueryHooks };
