import { GassmaController } from "../../gassmaController";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import {
  JoinedHitRowData,
  JoinedOneTableData,
  JoinUse,
} from "../../types/joinType";
import { joiner } from "./join/joiner";
import { whereFilter } from "./whereFilter";

const getJoinData = (
  join: JoinUse | null,
  gassmaControllerUtil: GassmaControllerUtil,
  gassmaController: GassmaController
) => {
  const allRowDataTheTable = whereFilter({}, gassmaControllerUtil);

  if (!join) return allRowDataTheTable;

  const usedJoinData: JoinedHitRowData[] = allRowDataTheTable.map(
    (oneRowDataTheTable) => {
      const oneTableData: JoinedOneTableData = {
        table: gassmaController,
        rowNumber: oneRowDataTheTable.rowNumber,
        row: oneRowDataTheTable.row,
      };

      const joinedHitRowData: JoinedHitRowData = {
        rowNumber: oneRowDataTheTable.rowNumber,
        joinedRow: [oneTableData],
      };

      return joinedHitRowData;
    }
  );

  joiner(usedJoinData, join);
};

export { getJoinData };
