import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import {
  clearGasGlobals,
  makeLoggedSheet,
} from "../transaction/transactionTestClient";

type CountingSheet = {
  sheet: any;
  trips: () => number;
  reset: () => void;
  snapshot: () => unknown[][];
};

const makeCountingSheet = (
  name: string,
  initial: unknown[][],
): CountingSheet => {
  const logged = makeLoggedSheet(name, initial);
  const base: any = logged.sheet;
  let trips = 0;
  const sheet: any = {
    ...base,
    getLastRow: () => {
      trips += 1;
      return base.getLastRow();
    },
    getRange: (row: number, col: number, numRows: number, numCols: number) => {
      const range = base.getRange(row, col, numRows, numCols);
      return {
        ...range,
        getValues: () => {
          trips += 1;
          return range.getValues();
        },
        setValues: (values: unknown[][]) => {
          trips += 1;
          range.setValues(values);
        },
      };
    },
    deleteRow: (rowIndex: number) => {
      trips += 1;
      base.deleteRow(rowIndex);
    },
    deleteRows: (rowPosition: number, howMany: number) => {
      trips += 1;
      base.deleteRows(rowPosition, howMany);
    },
  };
  return {
    sheet,
    trips: () => trips,
    reset: () => {
      trips = 0;
    },
    snapshot: logged.snapshot,
  };
};

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!(controller instanceof GassmaController)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

type M2mEnv = {
  client: GassmaClient;
  posts: CountingSheet;
  tags: CountingSheet;
  postTags: CountingSheet;
  propsStore: Record<string, string>;
  totalTrips: () => number;
  resetTrips: () => void;
};

type M2mEnvConfig = {
  tagRows?: unknown[][];
  junctionRows?: unknown[][];
  autoincrementSeed?: number;
};

const buildM2mEnv = (config: M2mEnvConfig = {}): M2mEnv => {
  const posts = makeCountingSheet("Posts", [
    ["id", "title"],
    [1, "A"],
  ]);
  const tags = makeCountingSheet("Tags", [
    ["id", "name"],
    ...(config.tagRows ?? []),
  ]);
  const postTags = makeCountingSheet("PostTags", [
    ["postId", "tagId"],
    ...(config.junctionRows ?? []),
  ]);
  const sheets = [posts.sheet, tags.sheet, postTags.sheet];
  const spreadsheet: any = {
    getId: () => "m2m-test",
    getSheets: () => sheets,
    getSheetByName: (n: string) =>
      sheets.find((s: any) => s.getName() === n) ?? null,
  };
  const propsStore: Record<string, string> = {};
  if (config.autoincrementSeed !== undefined) {
    propsStore["gassma_autoincrement_m2m-test_Tags_id"] = String(
      config.autoincrementSeed,
    );
  }
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => propsStore[key] ?? null,
        setProperty: (key: string, value: string) => {
          propsStore[key] = value;
        },
        deleteProperty: (key: string) => {
          delete propsStore[key];
        },
        getKeys: () => Object.keys(propsStore),
      }),
    },
  });
  const client = new GassmaClient({
    relations: {
      Posts: {
        tags: {
          type: "manyToMany",
          to: "Tags",
          field: "id",
          reference: "id",
          through: { sheet: "PostTags", field: "postId", reference: "tagId" },
        },
      },
    },
    autoincrement: { Tags: "id" },
  });
  const all = [posts, tags, postTags];
  return {
    client,
    posts,
    tags,
    postTags,
    propsStore,
    totalTrips: () => all.reduce((sum, s) => sum + s.trips(), 0),
    resetTrips: () => {
      all.forEach((s) => {
        s.reset();
      });
    },
  };
};

afterEach(() => {
  clearGasGlobals();
});

const tagRows = (count: number): unknown[][] =>
  Array.from({ length: count }, (_, i) => [i + 1, `t${i + 1}`]);

const setWheres = (count: number): { id: number }[] =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

const runSetScenario = (k: number): { env: M2mEnv; trips: number } => {
  const env = buildM2mEnv({
    tagRows: tagRows(20),
    junctionRows: [
      [1, 5],
      [2, 7],
    ],
  });
  env.resetTrips();
  const posts: any = sheetOf(env.client, "Posts");
  posts.update({
    where: { id: 1 },
    data: { tags: { set: setWheres(k) } },
  });
  return { env, trips: env.totalTrips() };
};

const createItems = (count: number): { name: string }[] =>
  Array.from({ length: count }, (_, i) => ({ name: `n${i + 1}` }));

const runCreateScenario = (k: number): { env: M2mEnv; trips: number } => {
  const env = buildM2mEnv({ autoincrementSeed: 5 });
  env.resetTrips();
  const posts: any = sheetOf(env.client, "Posts");
  posts.create({
    data: { id: 2, title: "B", tags: { create: createItems(k) } },
  });
  return { env, trips: env.totalTrips() };
};

describe("manyToMany set のシート往復回数", () => {
  it("set の junction row 追記後のシート状態が正しい", () => {
    const { env } = runSetScenario(3);

    expect(env.postTags.snapshot()).toEqual([
      ["postId", "tagId"],
      [2, 7],
      [1, 1],
      [1, 2],
      [1, 3],
    ]);
    expect(env.tags.snapshot()).toEqual([["id", "name"], ...tagRows(20)]);
  });

  it("set 1 件でもシート状態が正しい", () => {
    const { env } = runSetScenario(1);

    expect(env.postTags.snapshot()).toEqual([
      ["postId", "tagId"],
      [2, 7],
      [1, 1],
    ]);
  });

  it("junction row の追記が 1 回にまとまり往復回数が削減されている", () => {
    const twenty = runSetScenario(20);

    expect(twenty.env.postTags.snapshot()).toEqual([
      ["postId", "tagId"],
      [2, 7],
      ...setWheres(20).map((w) => [1, w.id]),
    ]);
    expect([1, 3, 5, 20].map((k) => runSetScenario(k).trips)).toEqual([
      10, 10, 10, 10,
    ]);
  });
});

describe("manyToMany create のシート往復回数", () => {
  it("create のターゲットと junction row のシート状態・採番順が正しい", () => {
    const { env } = runCreateScenario(3);

    expect(env.tags.snapshot()).toEqual([
      ["id", "name"],
      [6, "n1"],
      [7, "n2"],
      [8, "n3"],
    ]);
    expect(env.postTags.snapshot()).toEqual([
      ["postId", "tagId"],
      [2, 6],
      [2, 7],
      [2, 8],
    ]);
    expect(env.propsStore["gassma_autoincrement_m2m-test_Tags_id"]).toBe("8");
  });

  it("create 1 件でもシート状態・採番が正しい", () => {
    const { env } = runCreateScenario(1);

    expect(env.tags.snapshot()).toEqual([
      ["id", "name"],
      [6, "n1"],
    ]);
    expect(env.postTags.snapshot()).toEqual([
      ["postId", "tagId"],
      [2, 6],
    ]);
    expect(env.propsStore["gassma_autoincrement_m2m-test_Tags_id"]).toBe("6");
  });

  it("ターゲットと junction の追記が 1 回ずつにまとまり往復回数が削減されている", () => {
    const twenty = runCreateScenario(20);

    expect(twenty.env.tags.snapshot()).toEqual([
      ["id", "name"],
      ...Array.from({ length: 20 }, (_, i) => [i + 6, `n${i + 1}`]),
    ]);
    expect(twenty.env.postTags.snapshot()).toEqual([
      ["postId", "tagId"],
      ...Array.from({ length: 20 }, (_, i) => [2, i + 6]),
    ]);
    expect(twenty.env.propsStore["gassma_autoincrement_m2m-test_Tags_id"]).toBe(
      "25",
    );
    expect([1, 3, 5, 20].map((k) => runCreateScenario(k).trips)).toEqual([
      12, 12, 12, 12,
    ]);
  });
});
