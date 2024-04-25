import { CreateData } from "./createTypes";
import { DeleteData, FindData, UpdateData } from "./findTypes";

type GassmaControllerUtil = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  startRowNumber: number;
  startColumNumber: number;
  endColumNumber: number;
  getTitle: () => any[];
  getWantFindIndex: (wantData: FindData | DeleteData | UpdateData) => number[];
  getWantUpdateIndex: (wantData: CreateData | UpdateData) => number[];
  allData: () => any[][];
};

export { GassmaControllerUtil };
