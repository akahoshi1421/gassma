import { GassmaController } from "./gassmaController";
import type { GassmaSheet } from "./types/gassmaTypes";
import type {
  GassmaClientOptions,
  RelationsConfig,
} from "./types/relationTypes";
import type { WhereUse } from "./types/coreTypes";
import { validateRelationsConfig } from "./util/relation/validation/validateRelationsConfig";

const isClientOptions = (
  arg: string | GassmaClientOptions | undefined,
): arg is GassmaClientOptions => {
  return typeof arg === "object" && arg !== null;
};

class GassmaClient {
  public readonly sheets: GassmaSheet = {};

  constructor(idOrOptions?: string | GassmaClientOptions) {
    const id = isClientOptions(idOrOptions) ? idOrOptions.id : idOrOptions;
    const relations = isClientOptions(idOrOptions)
      ? idOrOptions.relations
      : undefined;

    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const mySheets = spreadSheet.getSheets();

    mySheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      const sheetController = new GassmaController(sheetName, id);
      this.sheets[sheetName] = sheetController;
    });

    if (relations) {
      this.injectRelations(relations);
    }
  }

  private injectRelations(relations: RelationsConfig) {
    const cache = new Map<string, string[]>();
    const getColumnHeaders = (sheetName: string): string[] => {
      const cached = cache.get(sheetName);
      if (cached) return cached;
      const headers = this.sheets[sheetName].getColumnHeaders();
      cache.set(sheetName, headers);
      return headers;
    };

    validateRelationsConfig(relations, this.sheets, getColumnHeaders);

    const findManyOnSheet = (
      sheetName: string,
      findData: { where?: WhereUse },
    ): Record<string, unknown>[] => {
      const controller = this.sheets[sheetName];
      if (!controller) {
        throw new Error(`Target sheet "${sheetName}" is not accessible`);
      }
      return controller.findMany(findData);
    };

    Object.keys(relations).forEach((sheetName) => {
      const controller = this.sheets[sheetName];
      if (!controller) return;

      controller._setRelationContext({
        relations: relations[sheetName],
        findManyOnSheet,
      });
    });
  }
}

export { GassmaClient };
