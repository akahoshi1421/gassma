import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import { NestedWriteWithoutRelationsError } from "../../errors/relation/nestedWriteError";
import { getTitle } from "../core/getTitle";
import {
  extractRelationDataForUpdate,
  isUpdateNestedWriteOperation,
} from "../update/nestedWrite/extractRelationDataForUpdate";
import { validateDataColumns } from "./validateDataColumns";

const validateUpdateColumnsEarly = (
  util: GassmaControllerUtil,
  data: Record<string, unknown>,
  relationContext: RelationContext | null,
  mode: "update" | "updateMany",
  precomputedTitles?: string[],
): string[] => {
  const titles = precomputedTitles ?? getTitle(util);
  if (mode === "update" && !relationContext) {
    const hasNestedShapeValue = Object.entries(data).some(
      ([key, value]) =>
        !titles.includes(key) && isUpdateNestedWriteOperation(value),
    );
    if (hasNestedShapeValue) throw new NestedWriteWithoutRelationsError();
  }
  if (!util.whereValidation) return titles;
  const scalarData =
    mode === "update" && relationContext
      ? extractRelationDataForUpdate(data, relationContext.relations).scalarData
      : data;
  validateDataColumns(scalarData, titles, util.whereValidation, mode);
  return titles;
};

export { validateUpdateColumnsEarly };
