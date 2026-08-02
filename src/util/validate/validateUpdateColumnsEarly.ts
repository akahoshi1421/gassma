import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import { getTitle } from "../core/getTitle";
import { extractRelationDataForUpdate } from "../update/nestedWrite/extractRelationDataForUpdate";
import { validateDataColumns } from "./validateDataColumns";

const validateUpdateColumnsEarly = (
  util: GassmaControllerUtil,
  data: Record<string, unknown>,
  relationContext: RelationContext,
  mode: "update" | "updateMany",
): string[] => {
  const titles = getTitle(util);
  if (!util.whereValidation) return titles;
  const scalarData =
    mode === "update"
      ? extractRelationDataForUpdate(data, relationContext.relations).scalarData
      : data;
  validateDataColumns(scalarData, titles, util.whereValidation, mode);
  return titles;
};

export { validateUpdateColumnsEarly };
