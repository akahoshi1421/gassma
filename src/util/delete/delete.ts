import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { DeleteSingleData } from "../../types/findTypes";
import type { RelationContext } from "../../types/relationTypes";
import { findFirstFunc } from "../find/findFirst";
import { findedDataSelect } from "../find/findUtil/findDataSelect";
import { omitFunc } from "../find/findUtil/omit";
import { resolveOnDelete } from "../relation/onDelete/resolveOnDelete";
import { resolveInclude } from "../relation/resolveInclude";
import { deleteManyFunc } from "./deleteMany";

const deleteFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteSingleData,
  relationContext?: RelationContext | null,
): Record<string, unknown> | null => {
  const record = findFirstFunc(gassmaControllerUtil, {
    where: deleteData.where,
  });
  if (!record) return null;

  let includeResult: Record<string, unknown>[] | null = null;
  if (deleteData.include && relationContext) {
    includeResult = resolveInclude(
      [record],
      deleteData.include,
      relationContext,
    );
  }

  if (relationContext) {
    resolveOnDelete([record], relationContext);
  }

  deleteManyFunc(gassmaControllerUtil, { where: deleteData.where, limit: 1 });

  if (includeResult) return includeResult[0] ?? null;
  if (deleteData.select) return findedDataSelect(deleteData.select, record);
  if (deleteData.omit) return omitFunc(deleteData.omit, record);

  return record;
};

export { deleteFunc };
