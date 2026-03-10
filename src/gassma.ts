import { GassmaController } from "./gassmaController";
import type { AnyUse, WhereUse } from "./types/coreTypes";
import type { GassmaSheet } from "./types/gassmaTypes";
import type {
  GassmaClientOptions,
  IncludeData,
  RelationsConfig,
} from "./types/relationTypes";
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
    const globalOmit = isClientOptions(idOrOptions)
      ? idOrOptions.omit
      : undefined;
    const defaults = isClientOptions(idOrOptions)
      ? idOrOptions.defaults
      : undefined;
    const updatedAt = isClientOptions(idOrOptions)
      ? idOrOptions.updatedAt
      : undefined;
    const ignore = isClientOptions(idOrOptions)
      ? idOrOptions.ignore
      : undefined;

    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const mySheets = spreadSheet.getSheets();

    mySheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      const sheetController = new GassmaController(sheetName, id);
      if (globalOmit && globalOmit[sheetName]) {
        sheetController._setGlobalOmit(globalOmit[sheetName]);
      }
      if (defaults && defaults[sheetName]) {
        sheetController._setDefaults(defaults[sheetName]);
      }
      if (updatedAt && updatedAt[sheetName]) {
        const fields = updatedAt[sheetName];
        sheetController._setUpdatedAt(
          Array.isArray(fields) ? fields : [fields],
        );
      }
      if (ignore && ignore[sheetName]) {
        const fields = ignore[sheetName];
        sheetController._setIgnore(Array.isArray(fields) ? fields : [fields]);
      }
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
      findData: { where?: WhereUse; include?: IncludeData },
    ): Record<string, unknown>[] => {
      const controller = this.sheets[sheetName];
      if (!controller) {
        throw new Error(`Target sheet "${sheetName}" is not accessible`);
      }
      return controller.findMany(findData);
    };

    const deleteManyOnSheet = (
      sheetName: string,
      deleteData: { where: WhereUse },
    ): { count: number } => {
      const controller = this.sheets[sheetName];
      if (!controller) {
        throw new Error(`Target sheet "${sheetName}" is not accessible`);
      }
      return controller.deleteMany(deleteData);
    };

    const updateManyOnSheet = (
      sheetName: string,
      updateData: { where?: WhereUse; data: AnyUse },
    ): { count: number } => {
      const controller = this.sheets[sheetName];
      if (!controller) {
        throw new Error(`Target sheet "${sheetName}" is not accessible`);
      }
      return controller.updateMany(updateData);
    };

    const createOnSheet = (
      sheetName: string,
      createData: { data: Record<string, unknown> },
    ): Record<string, unknown> => {
      const controller = this.sheets[sheetName];
      if (!controller) {
        throw new Error(`Target sheet "${sheetName}" is not accessible`);
      }
      return controller.create({ data: createData.data as AnyUse });
    };

    const createManyOnSheet = (
      sheetName: string,
      createManyData: { data: AnyUse[] },
    ): { count: number } | undefined => {
      const controller = this.sheets[sheetName];
      if (!controller) {
        throw new Error(`Target sheet "${sheetName}" is not accessible`);
      }
      return controller.createMany(createManyData);
    };

    Object.keys(relations).forEach((sheetName) => {
      const controller = this.sheets[sheetName];
      if (!controller) return;

      controller._setRelationContext({
        relations: relations[sheetName],
        findManyOnSheet,
        deleteManyOnSheet,
        updateManyOnSheet,
        createOnSheet,
        createManyOnSheet,
      });
    });
  }
}

export { GassmaClient };
