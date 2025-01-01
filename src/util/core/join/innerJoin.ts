import { InnerJoin, JoinedHitRowData } from "../../../types/joinType";
import { whereFilter } from "../whereFilter";

const innerJoin = (joinData: JoinedHitRowData[], join: InnerJoin) => {
  const rightSheetData = join.sheetName.getGassmaControllerUtil();

  const rightAllDataWillJoinData = whereFilter({}, rightSheetData);
  const { leftColumnName, rightColumnName } = join.conditions;

  const newJoinedDataIncludeNull = joinData.map((oneRowJoinedData, index) => {
    oneRowJoinedData.joinedRow.map((oneTableRow) => {
      const leftSheetOneTableData = oneTableRow.table.getGassmaControllerUtil();
    });
  });
};

export { innerJoin };
