import { GassmaController } from "./gassmaController";
import type { AnyUse, WhereUse } from "./types/coreTypes";
import type { GassmaSheet } from "./types/gassmaTypes";
import type {
  GassmaClientOptions,
  IncludeData,
  RelationsConfig,
} from "./types/relationTypes";
import { isSheetIgnored } from "./util/ignore/isSheetIgnored";
import { resolveCodeName } from "./util/map/mapSheetName";
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
    const autoincrement = isClientOptions(idOrOptions)
      ? idOrOptions.autoincrement
      : undefined;
    const ignore = isClientOptions(idOrOptions)
      ? idOrOptions.ignore
      : undefined;
    const map = isClientOptions(idOrOptions) ? idOrOptions.map : undefined;
    const ignoreSheetsRaw = isClientOptions(idOrOptions)
      ? idOrOptions.ignoreSheets
      : undefined;
    const ignoreSheets = ignoreSheetsRaw
      ? Array.isArray(ignoreSheetsRaw)
        ? ignoreSheetsRaw
        : [ignoreSheetsRaw]
      : [];
    const mapSheets = isClientOptions(idOrOptions)
      ? (idOrOptions.mapSheets ?? {})
      : {};

    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const mySheets = spreadSheet.getSheets();

    mySheets.forEach((sheet) => {
      const sheetName = sheet.getName();
      const codeName = resolveCodeName(sheetName, mapSheets);
      if (isSheetIgnored(codeName, ignoreSheets)) return;
      const sheetController = new GassmaController(sheetName, id);
      if (codeName !== sheetName) {
        sheetController._setCodeName(codeName);
      }
      if (globalOmit && globalOmit[codeName]) {
        sheetController._setGlobalOmit(globalOmit[codeName]);
      }
      if (autoincrement && autoincrement[codeName]) {
        const fields = autoincrement[codeName];
        sheetController._setAutoincrement(
          Array.isArray(fields) ? fields : [fields],
        );
      }
      if (defaults && defaults[codeName]) {
        sheetController._setDefaults(defaults[codeName]);
      }
      if (updatedAt && updatedAt[codeName]) {
        const fields = updatedAt[codeName];
        sheetController._setUpdatedAt(
          Array.isArray(fields) ? fields : [fields],
        );
      }
      if (ignore && ignore[codeName]) {
        const fields = ignore[codeName];
        sheetController._setIgnore(Array.isArray(fields) ? fields : [fields]);
      }
      if (map && map[codeName]) {
        sheetController._setMap(map[codeName]);
      }
      this.sheets[codeName] = sheetController;
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
