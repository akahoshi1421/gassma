import type { AnyUse, Omit, Select, WhereUse } from "../../types/coreTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { IncludeData, RelationContext } from "../../types/relationTypes";
import { createFunc } from "../create/create";
import { findFirstFunc } from "../find/findFirst";
import { findedDataSelect } from "../find/findUtil/findDataSelect";
import { omitFunc } from "../find/findUtil/omit";
import { resolveInclude } from "../relation/resolveInclude";
import { updateManyFunc } from "../update/updateMany";

type UpsertSingleData = {
  where: WhereUse;
  create: AnyUse;
  update: AnyUse;
  select?: Select;
  include?: IncludeData;
  omit?: Omit;
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
    const created = createFunc(gassmaControllerUtil, {
      data: upsertData.create,
    });

    if (upsertData.include && relationContext) {
      const resolved = resolveInclude(
        [created],
        upsertData.include,
        relationContext,
      );
      return resolved[0] ?? created;
    }
    if (upsertData.select) return findedDataSelect(upsertData.select, created);
    if (upsertData.omit) return omitFunc(upsertData.omit, created);

    return created;
  }

  updateManyFunc(gassmaControllerUtil, {
    where: upsertData.where,
    data: upsertData.update,
    limit: 1,
  });

  const updated = findFirstFunc(gassmaControllerUtil, {
    where: upsertData.where,
  });
  if (!updated) return record;

  if (upsertData.include && relationContext) {
    const resolved = resolveInclude(
      [updated],
      upsertData.include,
      relationContext,
    );
    return resolved[0] ?? updated;
  }
  if (upsertData.select) return findedDataSelect(upsertData.select, updated);
  if (upsertData.omit) return omitFunc(upsertData.omit, updated);

  return updated;
};

export { upsertFunc };
