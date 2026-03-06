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
import { resolveCount } from "./resolveCount";

const resolveInclude = (
  parents: Record<string, unknown>[],
  include: IncludeData,
  context: RelationContext,
): Record<string, unknown>[] => {
  validateIncludeOptions(include);

  if (parents.length === 0) return [];

  const countValue = include._count;

  let result = Object.keys(include)
    .filter((key) => key !== "_count")
    .reduce((acc, relationName) => {
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
            acc,
            relation,
            relationName,
            findMany,
            options,
          );
        case "oneToOne":
          return resolveOneToOne(
            acc,
            relation,
            relationName,
            findMany,
            options,
          );
        case "manyToOne":
          return resolveManyToOne(
            acc,
            relation,
            relationName,
            findMany,
            options,
          );
        case "manyToMany":
          return resolveManyToMany(
            acc,
            relation,
            relationName,
            findMany,
            options,
          );
        default:
          return acc;
      }
    }, parents);

  if (countValue !== undefined) {
    result = resolveCount(result, countValue, context);
  }

  return result;
};

export { resolveInclude };
