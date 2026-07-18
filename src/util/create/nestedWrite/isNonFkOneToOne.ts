import type { RelationDefinition } from "../../../types/relationTypes";

const isNonFkOneToOne = (relation: RelationDefinition): boolean =>
  relation.type === "oneToOne" && relation.ownsFk === false;

export { isNonFkOneToOne };
