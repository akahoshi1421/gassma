import { GassmaController } from "../gassmaController";
import { HitRowData } from "./hitRowDataType";

type JoinCondition = {
  leftColumnName: string;
  rightColumnName: string;
};

type InnerJoin = {
  type: "inner";
  conditions: JoinCondition;
} & JoinCore;

type OuterJoin = {
  type: "outer";
  conditions: JoinCondition;
  direction: "left" | "right" | "full";
} & JoinCore;

type CrossJoin = {
  type: "cross";
} & JoinCore;

type JoinCore = {
  sheetName: GassmaController;
  join?: JoinUse;
};

type JoinUse = InnerJoin | OuterJoin | CrossJoin;

type JoinedOneTableData = {
  table: GassmaController;
} & HitRowData;

type JoinedHitRowData = {
  rowNumber: number;
  joinedRow: JoinedOneTableData[];
};

export { InnerJoin, OuterJoin, JoinUse, JoinedOneTableData, JoinedHitRowData };
