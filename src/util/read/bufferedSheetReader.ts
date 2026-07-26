import type { VirtualSheetStore } from "../transaction/virtualSheetStore";
import type { SheetReader } from "./sheetReader";

const createBufferedSheetReader = (store: VirtualSheetStore): SheetReader => ({
  getLastRow: (sheet) => store.getLastRow(sheet),
  getRangeValues: (sheet, rowNumber, columnNumber, rowLength, columnLength) =>
    store.getRangeValues(
      sheet,
      rowNumber,
      columnNumber,
      rowLength,
      columnLength,
    ),
});

export { createBufferedSheetReader };
