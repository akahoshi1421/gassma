import type { AnyUse } from "../../types/coreTypes";
import type { UpsertSingleData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import { getTitle } from "../core/getTitle";
import { createFunc } from "../create/create";
import { resolveNestedCreate } from "../create/nestedWrite/resolveNestedCreate";
import { findFirstFunc } from "../find/findFirst";
import { findManyFunc } from "../find/findMany";
import { findedDataSelect } from "../find/findUtil/findDataSelect";
import { omitFunc } from "../find/findUtil/omit";
import { resolveInclude } from "../relation/resolveInclude";
import { resolveOnUpdate } from "../relation/onUpdate/resolveOnUpdate";
import { resolveNestedUpdate } from "../update/nestedWrite/resolveNestedUpdate";
import { resolveNumberOperations } from "../update/resolveNumberOperation";
import { validateCreateColumnsEarly } from "../validate/validateCreateColumnsEarly";
import { validateUpdateColumnsEarly } from "../validate/validateUpdateColumnsEarly";

const applyOptions = (
  result: Record<string, unknown>,
  upsertData: UpsertSingleData,
  relationContext?: RelationContext | null,
): Record<string, unknown> => {
  if (upsertData.include && relationContext) {
    const resolved = resolveInclude(
      [result],
      upsertData.include,
      relationContext,
    );
    const included = resolved[0] ?? result;
    if (upsertData.omit) return omitFunc(upsertData.omit, included);
    return included;
  }
  if (upsertData.select) return findedDataSelect(upsertData.select, result);
  if (upsertData.omit) return omitFunc(upsertData.omit, result);
  return result;
};

const upsertFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  upsertData: UpsertSingleData,
  relationContext?: RelationContext | null,
  prepareCreate?: (data: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> => {
  const titles = getTitle(gassmaControllerUtil);
  validateCreateColumnsEarly(
    gassmaControllerUtil,
    upsertData.create,
    relationContext ?? null,
    titles,
  );
  validateUpdateColumnsEarly(
    gassmaControllerUtil,
    upsertData.update,
    relationContext ?? null,
    "update",
    titles,
  );

  const record = findFirstFunc(gassmaControllerUtil, {
    where: upsertData.where,
  });

  if (!record) {
    const wrappedCreate = (
      data: Record<string, unknown>,
      rowTitles?: string[],
    ) => createFunc(gassmaControllerUtil, { data: data as AnyUse }, rowTitles);
    const created = resolveNestedCreate(
      upsertData.create,
      wrappedCreate,
      relationContext ?? undefined,
      {
        getTitles: () => titles,
        validation: gassmaControllerUtil.whereValidation,
        ...(prepareCreate ? { prepare: prepareCreate } : {}),
      },
    );
    return applyOptions(created, upsertData, relationContext);
  }

  if (relationContext) {
    const beforeRecords = findManyFunc(gassmaControllerUtil, {
      where: upsertData.where,
      take: 1,
    });
    if (beforeRecords.length > 0) {
      const predictedAfter = resolveNumberOperations(
        beforeRecords[0],
        upsertData.update,
      );
      resolveOnUpdate(beforeRecords, [predictedAfter], relationContext);
    }
  }

  const updated = resolveNestedUpdate(
    gassmaControllerUtil,
    { where: upsertData.where, data: upsertData.update },
    relationContext ?? undefined,
    titles,
  );
  if (!updated) return record;

  return applyOptions(updated, upsertData, relationContext);
};

export { upsertFunc };
