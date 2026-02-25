import type {
  IncludeData,
  IncludeItemOptions,
  RelationContext,
} from "../../types/relationTypes";
import { GassmaRelationNotFoundError } from "../../errors/relation/relationError";
import { validateIncludeOptions } from "./validation/validateIncludeOptions";
import { resolveOneToMany } from "./resolvers/oneToMany";
import { resolveOneToOne } from "./resolvers/oneToOne";
import { resolveManyToOne } from "./resolvers/manyToOne";
import { resolveManyToMany } from "./resolvers/manyToMany";

const resolveInclude = (
  parents: Record<string, unknown>[],
  include: IncludeData,
  context: RelationContext,
): Record<string, unknown>[] => {
  validateIncludeOptions(include);

  if (parents.length === 0) return [];

  let result = parents;

  for (const relationName of Object.keys(include)) {
    const relation = context.relations[relationName];
    if (!relation) {
      throw new GassmaRelationNotFoundError(relationName, "");
    }

    const includeValue = include[relationName];
    const options: IncludeItemOptions | undefined =
      includeValue === true ? undefined : includeValue;

    const findMany = context.findManyOnSheet;

    switch (relation.type) {
      case "oneToMany":
        result = resolveOneToMany(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
        break;
      case "oneToOne":
        result = resolveOneToOne(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
        break;
      case "manyToOne":
        result = resolveManyToOne(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
        break;
      case "manyToMany":
        result = resolveManyToMany(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
        break;
    }
  }

  return result;
};

export { resolveInclude };
