type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

type VirtualSheet = {
  grid: unknown[][];
  width: number;
};

const snapshotSheet = (sheet: Sheet): VirtualSheet => {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 1 || lastColumn < 1) {
    return { grid: [], width: Math.max(lastColumn, 0) };
  }
  return {
    grid: sheet.getRange(1, 1, lastRow, lastColumn).getValues(),
    width: lastColumn,
  };
};

const createVirtualSheetStore = () => {
  const virtualSheets = new Map<Sheet, VirtualSheet>();

  const getVirtual = (sheet: Sheet): VirtualSheet => {
    const existing = virtualSheets.get(sheet);
    if (existing) return existing;
    const created = snapshotSheet(sheet);
    virtualSheets.set(sheet, created);
    return created;
  };

  const appendRows = (
    sheet: Sheet,
    startColumnNumber: number,
    columnLength: number,
    rows: unknown[][],
  ) => {
    const virtual = getVirtual(sheet);
    virtual.width = Math.max(
      virtual.width,
      startColumnNumber - 1 + columnLength,
    );
    rows.forEach((row) => {
      const appended: unknown[] = Array.from(
        { length: virtual.width },
        () => "",
      );
      row.forEach((value, index) => {
        appended[startColumnNumber - 1 + index] = value;
      });
      virtual.grid.push(appended);
    });
  };

  const updateRow = (
    sheet: Sheet,
    rowNumber: number,
    startColumnNumber: number,
    columnLength: number,
    row: unknown[],
  ) => {
    const virtual = getVirtual(sheet);
    virtual.width = Math.max(
      virtual.width,
      startColumnNumber - 1 + columnLength,
    );
    while (virtual.grid.length < rowNumber) {
      virtual.grid.push([]);
    }
    const target = virtual.grid[rowNumber - 1];
    row.forEach((value, index) => {
      target[startColumnNumber - 1 + index] = value;
    });
  };

  const deleteRow = (sheet: Sheet, rowNumber: number) => {
    getVirtual(sheet).grid.splice(rowNumber - 1, 1);
  };

  const getLastRow = (sheet: Sheet): number => getVirtual(sheet).grid.length;

  const getRangeValues = (
    sheet: Sheet,
    rowNumber: number,
    columnNumber: number,
    rowLength: number,
    columnLength: number,
  ): any[][] => {
    const virtual = getVirtual(sheet);
    return Array.from({ length: rowLength }, (_, rowIndex) => {
      const row = virtual.grid[rowNumber - 1 + rowIndex] ?? [];
      return Array.from({ length: columnLength }, (_, columnIndex) => {
        const cell = row[columnNumber - 1 + columnIndex];
        return cell === undefined ? "" : cell;
      });
    });
  };

  return { appendRows, updateRow, deleteRow, getLastRow, getRangeValues };
};

type VirtualSheetStore = ReturnType<typeof createVirtualSheetStore>;

export { createVirtualSheetStore };
export type { VirtualSheetStore };
