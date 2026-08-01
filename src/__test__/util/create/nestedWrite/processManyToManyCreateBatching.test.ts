import type { AnyUse, WhereUse } from "../../../../types/coreTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { processManyToMany } from "../../../../util/create/nestedWrite/processManyToMany";

type Row = Record<string, unknown>;

const matchesPlain = (record: Row, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([key, value]) => {
    if (!(key in record)) return true;
    if (value !== null && typeof value === "object") return false;
    const wanted = value === "" ? null : value;
    return record[key] === wanted;
  });

const makeTagSheets = (initialTags: Row[]) => {
  const tags: Row[] = initialTags.map((row) => ({ ...row }));
  const junctions: Row[] = [];
  const calls: string[] = [];
  let nextId = 10;

  const findManyOnSheet = jest.fn(
    (sheet: string, findData: { where?: WhereUse }) => {
      calls.push(`find:${sheet}`);
      const where = findData.where ?? {};
      if (Object.keys(where).length === 0) return tags.map((r) => ({ ...r }));
      return tags
        .filter((row) => matchesPlain(row, where))
        .map((r) => ({ ...r }));
    },
  );

  const createOnSheet = jest.fn((sheet: string, createData: { data: Row }) => {
    calls.push(`create:${sheet}`);
    if (sheet === "PostTags") {
      const record = { ...createData.data };
      junctions.push(record);
      return { ...record };
    }
    const record = { id: nextId, ...createData.data };
    nextId += 1;
    tags.push(record);
    return { ...record };
  });

  const createManyOnSheet = jest.fn(
    (sheet: string, createManyData: { data: AnyUse[] }) => {
      calls.push(`createMany:${sheet}`);
      createManyData.data.forEach((row) => {
        const record = { ...row };
        if (sheet === "PostTags") junctions.push(record);
        else tags.push(record);
      });
      return { count: createManyData.data.length };
    },
  );

  const createManyAndReturnOnSheet = jest.fn(
    (sheet: string, createManyData: { data: AnyUse[] }) => {
      calls.push(`createManyAndReturn:${sheet}`);
      return createManyData.data.map((row) => {
        const record = { id: nextId, ...row };
        nextId += 1;
        if (sheet === "PostTags") junctions.push({ ...record });
        else tags.push({ ...record });
        return { ...record };
      });
    },
  );

  return {
    tags,
    junctions,
    calls,
    findManyOnSheet,
    createOnSheet,
    createManyOnSheet,
    createManyAndReturnOnSheet,
  };
};

const tagsRelation: RelationDefinition = {
  type: "manyToMany",
  to: "Tags",
  field: "id",
  reference: "id",
  through: {
    sheet: "PostTags",
    field: "postId",
    reference: "tagId",
  },
};

type RunOptions = {
  relation?: RelationDefinition;
  withCreateManyAndReturn?: boolean;
  parent?: Row;
};

const runOps = (
  sheets: ReturnType<typeof makeTagSheets>,
  ops: NestedWriteOperation,
  options: RunOptions = {},
) => {
  const relation = options.relation ?? tagsRelation;
  const relationOps = new Map<string, NestedWriteOperation>();
  relationOps.set("tags", ops);
  const context: RelationContext = {
    relations: { tags: relation },
    findManyOnSheet: sheets.findManyOnSheet,
    createOnSheet: sheets.createOnSheet,
    createManyOnSheet: sheets.createManyOnSheet,
  };
  if (options.withCreateManyAndReturn !== false) {
    context.createManyAndReturnOnSheet = sheets.createManyAndReturnOnSheet;
  }
  processManyToMany(
    options.parent ?? { id: 1, title: "記事A" },
    relationOps,
    context,
  );
};

describe("processManyToMany create のバッチ化", () => {
  it("複数 create はターゲット 1 回・junction 1 回のまとめ書きで items 順に作られる", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, { create: [{ name: "TS" }, { name: "JS" }] });

    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.createManyAndReturnOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.createManyAndReturnOnSheet).toHaveBeenCalledWith("Tags", {
      data: [{ name: "TS" }, { name: "JS" }],
    });
    expect(sheets.calls).toEqual([
      "createManyAndReturn:Tags",
      "createMany:PostTags",
    ]);
    expect(sheets.tags).toEqual([
      { id: 10, name: "TS" },
      { id: 11, name: "JS" },
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 10 },
      { postId: 1, tagId: 11 },
    ]);
  });

  it("create が 1 件のときは従来どおり createOnSheet でターゲットと junction を作る", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, { create: { name: "TS" } });

    expect(sheets.createManyAndReturnOnSheet).not.toHaveBeenCalled();
    expect(sheets.calls).toEqual(["create:Tags", "create:PostTags"]);
    expect(sheets.junctions).toEqual([{ postId: 1, tagId: 10 }]);
  });

  it("createManyAndReturnOnSheet が無いコンテキストでは従来どおり 1 件ずつ作られる", () => {
    const sheets = makeTagSheets([]);

    runOps(
      sheets,
      { create: [{ name: "TS" }, { name: "JS" }] },
      { withCreateManyAndReturn: false },
    );

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.calls).toEqual([
      "create:Tags",
      "create:PostTags",
      "create:Tags",
      "create:PostTags",
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 10 },
      { postId: 1, tagId: 11 },
    ]);
  });

  it("自己 junction は従来どおり 1 件ずつ作られる", () => {
    const selfJunction: RelationDefinition = {
      type: "manyToMany",
      to: "Tags",
      field: "id",
      reference: "id",
      through: { sheet: "Tags", field: "postId", reference: "tagId" },
    };
    const sheets = makeTagSheets([]);

    runOps(
      sheets,
      { create: [{ name: "TS" }, { name: "JS" }] },
      { relation: selfJunction },
    );

    expect(sheets.createManyAndReturnOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(4);
  });

  it("item が nested write を含む場合はリレーション全体を従来どおり 1 件ずつに戻す", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, {
      create: [{ name: "TS", posts: { connect: { id: 5 } } }, { name: "JS" }],
    });

    expect(sheets.createManyAndReturnOnSheet).not.toHaveBeenCalled();
    expect(sheets.calls).toEqual([
      "create:Tags",
      "create:PostTags",
      "create:Tags",
      "create:PostTags",
    ]);
  });

  it("item にセル値でない値を含む場合は従来どおり 1 件ずつ作られる", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, {
      create: [{ name: "TS", meta: { color: "blue" } }, { name: "JS" }],
    });

    expect(sheets.createManyAndReturnOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(4);
  });

  it("null を含む item はまとめ書きされる", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, { create: [{ name: null }, { name: "JS" }] });

    expect(sheets.createManyAndReturnOnSheet).toHaveBeenCalledWith("Tags", {
      data: [{ name: null }, { name: "JS" }],
    });
  });

  it("親の値がセル値でない場合もターゲットはまとめ、junction は 1 件ずつ追記される", () => {
    const sheets = makeTagSheets([]);

    runOps(
      sheets,
      { create: [{ name: "TS" }, { name: "JS" }] },
      { parent: { title: "記事A" } },
    );

    expect(sheets.createManyAndReturnOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.junctions).toEqual([
      { postId: undefined, tagId: 10 },
      { postId: undefined, tagId: 11 },
    ]);
  });

  it("create と connect の併用でもシート跨ぎの書き込み順が従来と同じになる", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "GAS" },
      { id: 2, name: "JS2" },
    ]);

    runOps(sheets, {
      create: [{ name: "TS" }, { name: "JS" }],
      connect: [{ id: 1 }, { id: 2 }],
    });

    expect(sheets.calls).toEqual([
      "createManyAndReturn:Tags",
      "createMany:PostTags",
      "find:Tags",
      "createMany:PostTags",
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 10 },
      { postId: 1, tagId: 11 },
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 2 },
    ]);
  });
});
