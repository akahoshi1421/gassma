import { GassmaController } from "./gassmaController";
import type {
  ExtendedGassmaClient,
  GassmaExtension,
} from "./types/extendsTypes";
import type { GassmaSheet } from "./types/gassmaTypes";
import type { GassmaClientOptions } from "./types/relationTypes";
import { buildExtendedClient } from "./util/extends/buildExtendedClient";
import { isSheetIgnored } from "./util/ignore/isSheetIgnored";
import { resolveCodeName } from "./util/map/mapSheetName";
import { injectRelations } from "./util/relation/injectRelations";

const isClientOptions = (
  arg: string | GassmaClientOptions | undefined,
): arg is GassmaClientOptions => {
  return typeof arg === "object" && arg !== null;
};

class GassmaClient {
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
    const strictUndefinedChecks = isClientOptions(idOrOptions)
      ? (idOrOptions.strictUndefinedChecks ?? false)
      : false;

    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const mySheets = spreadSheet.getSheets();

    const controllers: GassmaSheet = {};

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
      if (strictUndefinedChecks) {
        sheetController._setStrictUndefinedChecks(true);
      }
      controllers[codeName] = sheetController;
    });

    Object.assign(this, controllers);

    if (relations) {
      injectRelations(relations, controllers);
    }
  }

  public $extends(extension: GassmaExtension): ExtendedGassmaClient {
    const controllers: GassmaSheet = {};
    Object.entries(this).forEach(([sheetName, value]) => {
      if (value && typeof value.findMany === "function") {
        controllers[sheetName] = value;
      }
    });
    return buildExtendedClient(controllers, [extension]);
  }
}

export { GassmaClient };
