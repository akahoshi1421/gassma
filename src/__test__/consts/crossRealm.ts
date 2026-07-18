import { runInNewContext } from "node:vm";

const createCrossRealmDate = (iso: string): Date =>
  runInNewContext(`new Date(${JSON.stringify(iso)})`);

const createCrossRealmValue = <T>(source: string): T =>
  runInNewContext(`(${source})`);

export { createCrossRealmDate, createCrossRealmValue };
