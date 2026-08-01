import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { resolveWriter } from "../write/sheetWriter";
import type { SheetReadCache } from "./cachedSheetReader";
import { createSheetReadCache } from "./cachedSheetReader";
import { resolveReader } from "./sheetReader";

let activeCache: SheetReadCache | null = null;
let writeDepth = 0;

const runWithReadCache = <T>(fn: () => T): T => {
  if (writeDepth > 0 || activeCache) return fn();
  activeCache = createSheetReadCache();
  try {
    return fn();
  } finally {
    activeCache = null;
  }
};

const runWithoutReadCache = <T>(fn: () => T): T => {
  if (activeCache) activeCache.clear();
  writeDepth += 1;
  try {
    return fn();
  } finally {
    writeDepth -= 1;
  }
};

const applyReadCache = (util: GassmaControllerUtil): GassmaControllerUtil => {
  if (!activeCache || writeDepth > 0) return util;
  return {
    ...util,
    reader: activeCache.wrapReader(resolveReader(util.reader)),
    writer: activeCache.wrapWriter(resolveWriter(util.writer)),
  };
};

export { applyReadCache, runWithoutReadCache, runWithReadCache };
