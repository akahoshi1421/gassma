import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import {
  applyInternalWriteBuffer,
  closeInternalWriteBuffer,
  flushInternalWriteBuffer,
  openInternalWriteBuffer,
} from "../write/internalWriteBuffer";
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

const runWithoutReadCache = <T>(fn: () => T, buffered = false): T => {
  if (activeCache) activeCache.clear();
  const isOutermost = writeDepth === 0;
  if (isOutermost && buffered) openInternalWriteBuffer();
  writeDepth += 1;
  try {
    const result = fn();
    if (isOutermost) flushInternalWriteBuffer();
    return result;
  } finally {
    writeDepth -= 1;
    if (isOutermost) closeInternalWriteBuffer();
  }
};

const applyReadCache = (util: GassmaControllerUtil): GassmaControllerUtil => {
  const base = applyInternalWriteBuffer(util);
  if (!activeCache || writeDepth > 0) return base;
  return {
    ...base,
    reader: activeCache.wrapReader(resolveReader(base.reader)),
    writer: activeCache.wrapWriter(resolveWriter(base.writer)),
  };
};

export { applyReadCache, runWithoutReadCache, runWithReadCache };
