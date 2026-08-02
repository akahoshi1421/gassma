import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import { NestedWriteWithoutRelationsError } from "../../errors/relation/nestedWriteError";
import { getTitle } from "../core/getTitle";
import {
  extractRelationData,
  isNestedWriteOperation,
} from "../create/nestedWrite/extractRelationData";
import { validateDataColumns } from "./validateDataColumns";

const validateCreateColumnsEarly = (
  util: GassmaControllerUtil,
  data: Record<string, unknown>,
  relationContext: RelationContext | null,
  precomputedTitles?: string[],
): string[] => {
  const titles = precomputedTitles ?? getTitle(util);
  if (!relationContext && Object.values(data).some(isNestedWriteOperation)) {
    throw new NestedWriteWithoutRelationsError();
  }
  if (!util.whereValidation) return titles;
  const scalarData = relationContext
    ? extractRelationData(data, relationContext.relations).scalarData
    : data;
  validateDataColumns(scalarData, titles, util.whereValidation, "create");
  return titles;
};

export { validateCreateColumnsEarly };
