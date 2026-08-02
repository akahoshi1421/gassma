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
  const record = findFirstFunc(gassmaControllerUtil, {
    where: upsertData.where,
  });

  if (!record) {
    const wrappedCreate = (data: Record<string, unknown>, titles?: string[]) =>
      createFunc(gassmaControllerUtil, { data: data as AnyUse }, titles);
    const created = resolveNestedCreate(
      upsertData.create,
      wrappedCreate,
      relationContext ?? undefined,
      {
        getTitles: () => getTitle(gassmaControllerUtil),
        validation: gassmaControllerUtil.whereValidation,
        ...(prepareCreate ? { prepare: prepareCreate } : {}),
      },
    );
    return applyOptions(created, upsertData, relationContext);
  }

  let precomputedTitles: string[] | undefined;
  if (relationContext) {
    precomputedTitles = validateUpdateColumnsEarly(
      gassmaControllerUtil,
      upsertData.update,
      relationContext,
      "update",
    );
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
    precomputedTitles,
  );
  if (!updated) return record;

  return applyOptions(updated, upsertData, relationContext);
};

export { upsertFunc };
