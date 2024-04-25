import { CreateData } from "./createTypes";
import { DeleteData, FindData, UpdateData } from "./findTypes";

type GassmaControllerUtil = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  startRowNumber: number;
  startColumNumber: number;
  endColumNumber: number;
};

export { GassmaControllerUtil };
