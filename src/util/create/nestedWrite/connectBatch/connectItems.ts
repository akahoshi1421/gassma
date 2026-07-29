import { NestedWriteConnectNotFoundError } from "../../../../errors/relation/nestedWriteError";
import type { AnyUse, WhereUse } from "../../../../types/coreTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { createTargetTable } from "./targetTable";
import { hasTopLevelEmptyString } from "./whereScan";

const batchConnect = (
  relation: RelationDefinition,
  items: WhereUse[],
  fkData: AnyUse,
  context: RelationContext,
): void => {
  const table = createTargetTable(context, relation.to);

  const plans = items.map((where) => {
    const local = table.canEvaluate(where);
    const exists = local
      ? table.matchRecords(where).length > 0
      : context.findManyOnSheet(relation.to, { where }).length > 0;
    const mergeable = local && !hasTopLevelEmptyString(where);
    return { where, exists, mergeable };
  });

  if (plans.some((plan) => !plan.exists)) {
    throw new NestedWriteConnectNotFoundError(relation.to);
  }

  const merged = plans.filter((plan) => plan.mergeable).map((p) => p.where);
  if (merged.length === 1) {
    context.updateManyOnSheet(relation.to, { where: merged[0], data: fkData });
  }
  if (merged.length >= 2) {
    context.updateManyOnSheet(relation.to, {
      where: { OR: merged },
      data: fkData,
    });
  }

  plans
    .filter((plan) => !plan.mergeable)
    .forEach((plan) => {
      context.updateManyOnSheet(relation.to, {
        where: plan.where,
        data: fkData,
      });
    });
};

export { batchConnect };
