import type { GassmaAny } from "../../../types/coreTypes";
import { isGassmaAny } from "../../relation/collectKeys";

const isCellValue = (value: unknown): value is GassmaAny =>
  value === null || isGassmaAny(value);

export { isCellValue };
