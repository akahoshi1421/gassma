type RowWrite = {
  rowNumber: number;
  row: unknown[];
};

type UpdateRun = {
  startRowNumber: number;
  rows: unknown[][];
};

type DeleteBlock = {
  rowPosition: number;
  howMany: number;
};

const groupUpdateRuns = (entries: RowWrite[]): UpdateRun[] => {
  const sorted = [...entries].sort((a, b) => a.rowNumber - b.rowNumber);
  return sorted.reduce<UpdateRun[]>((runs, entry) => {
    const last = runs[runs.length - 1];
    if (last && entry.rowNumber === last.startRowNumber + last.rows.length) {
      last.rows.push(entry.row);
      return runs;
    }
    runs.push({ startRowNumber: entry.rowNumber, rows: [entry.row] });
    return runs;
  }, []);
};

const groupDeleteBlocksDescending = (rowNumbers: number[]): DeleteBlock[] => {
  const sorted = [...rowNumbers].sort((a, b) => b - a);
  return sorted.reduce<DeleteBlock[]>((blocks, rowNumber) => {
    const last = blocks[blocks.length - 1];
    if (last && rowNumber === last.rowPosition - 1) {
      last.rowPosition = rowNumber;
      last.howMany += 1;
      return blocks;
    }
    blocks.push({ rowPosition: rowNumber, howMany: 1 });
    return blocks;
  }, []);
};

export { groupDeleteBlocksDescending, groupUpdateRuns };
export type { DeleteBlock, RowWrite, UpdateRun };
