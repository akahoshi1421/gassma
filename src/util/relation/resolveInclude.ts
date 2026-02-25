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

  return Object.keys(include).reduce((result, relationName) => {
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
        return resolveOneToMany(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
      case "oneToOne":
        return resolveOneToOne(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
      case "manyToOne":
        return resolveManyToOne(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
      case "manyToMany":
        return resolveManyToMany(
          result,
          relation,
          relationName,
          findMany,
          options,
        );
      default:
        return result;
    }
  }, parents);
};

export { resolveInclude };
