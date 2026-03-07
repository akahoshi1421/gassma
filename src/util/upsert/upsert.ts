import type { AnyUse } from "../../types/coreTypes";
import type { UpsertSingleData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
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
    return resolved[0] ?? result;
  }
  if (upsertData.select) return findedDataSelect(upsertData.select, result);
  if (upsertData.omit) return omitFunc(upsertData.omit, result);
  return result;
};

const upsertFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  upsertData: UpsertSingleData,
  relationContext?: RelationContext | null,
): Record<string, unknown> => {
  const record = findFirstFunc(gassmaControllerUtil, {
    where: upsertData.where,
  });

  if (!record) {
    const wrappedCreate = (data: Record<string, unknown>) =>
      createFunc(gassmaControllerUtil, { data: data as AnyUse });
    const created = resolveNestedCreate(
      upsertData.create,
      wrappedCreate,
      relationContext ?? undefined,
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
  );
  if (!updated) return record;

  return applyOptions(updated, upsertData, relationContext);
};

export { upsertFunc };
