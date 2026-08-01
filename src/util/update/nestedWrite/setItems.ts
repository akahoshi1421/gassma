import type { WhereUse } from "../../../types/coreTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { JunctionWriter } from "../../create/nestedWrite/connectBatch/junctionWriter";
import { createTargetTable } from "../../create/nestedWrite/connectBatch/targetTable";

const batchManyToManySet = (
  relation: RelationDefinition,
  items: WhereUse[],
  context: RelationContext,
  junction: JunctionWriter,
): void => {
  const oneByOne = () => {
    items.forEach((where) => {
      const found = context.findManyOnSheet(relation.to, { where });
      if (found.length > 0) {
        junction.add(found[0][relation.reference]);
        junction.flush();
      }
    });
  };

  const selfJunction = relation.through?.sheet === relation.to;
  if (items.length < 2 || selfJunction || !context.createManyOnSheet) {
    oneByOne();
    return;
  }

  const table = createTargetTable(context, relation.to);
  const foundRecords = items.map((where) =>
    table.canEvaluate(where)
      ? table.matchRecords(where)
      : context.findManyOnSheet(relation.to, { where }),
  );

  foundRecords.forEach((found) => {
    if (found.length > 0) {
      junction.add(found[0][relation.reference]);
    }
  });
  junction.flush();
};

export { batchManyToManySet };
