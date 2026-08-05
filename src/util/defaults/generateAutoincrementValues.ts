import type { Lock } from "../../types/relationTypes";
import { runWithLock } from "../lock/runWithLock";
import { buildAutoincrementKey } from "./autoincrementKey";

const LOCK_TIMEOUT_MS = 10000;

const generateAutoincrementValues = (
  fields: string[],
  keyBase: string,
  lock: Lock | null | undefined,
  count?: number,
): Record<string, number | number[]> =>
  runWithLock(lock, LOCK_TIMEOUT_MS, () => {
    const props = PropertiesService.getScriptProperties();
    const result: Record<string, number | number[]> = {};

    fields.forEach((field) => {
      const key = buildAutoincrementKey(keyBase, field);
      const current = Number(props.getProperty(key) || 0);

      if (count && count > 1) {
        const values: number[] = [];
        let next = current;
        Array.from({ length: count }).forEach(() => {
          next += 1;
          values.push(next);
        });
        props.setProperty(key, String(next));
        result[field] = values;
      } else {
        const next = current + 1;
        props.setProperty(key, String(next));
        result[field] = next;
      }
    });

    return result;
  });

export { generateAutoincrementValues };
