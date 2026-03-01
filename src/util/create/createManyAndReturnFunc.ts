import type { CreateManyData } from "../../types/createTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { createManyFunc } from "./createManyFunc";

const createManyAndReturnFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
): Record<string, unknown>[] => {
  const data = createManyData.data;
  if (data.length === 0) return [];

  createManyFunc(gassmaControllerUtil, createManyData);

  const titles = getTitle(gassmaControllerUtil);
  return data.map((row) =>
    titles.reduce<Record<string, unknown>>((record, title) => {
      record[title] = title in row ? row[title] : null;
      return record;
    }, {}),
  );
};

export { createManyAndReturnFunc };
