import { NestedWriteConnectNotFoundError } from "../../../../errors/relation/nestedWriteError";
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
    const record = { ...createData.data };
    calls.push(`create:${sheet}`);
    if (sheet === "PostTags") junctions.push(record);
    else tags.push(record);
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

  return {
    tags,
    junctions,
    calls,
    findManyOnSheet,
    createOnSheet,
    createManyOnSheet,
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
  withCreateMany?: boolean;
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
  };
  if (options.withCreateMany !== false) {
    context.createManyOnSheet = sheets.createManyOnSheet;
  }
  processManyToMany(
    options.parent ?? { id: 1, title: "記事A" },
    relationOps,
    context,
  );
};

describe("processManyToMany junction row の追記バッチ化", () => {
  it("複数 connect の junction row は 1 回の createManyOnSheet で items 順に追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
      { id: 3, name: "GAS" },
    ]);

    runOps(sheets, { connect: [{ id: 3 }, { id: 1 }, { id: 2 }] });

    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.createManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("PostTags", {
      data: [
        { postId: 1, tagId: 3 },
        { postId: 1, tagId: 1 },
        { postId: 1, tagId: 2 },
      ],
    });
  });

  it("connect が 1 件のときは従来どおり createOnSheet で追記される", () => {
    const sheets = makeTagSheets([{ id: 1, name: "TS" }]);

    runOps(sheets, { connect: { id: 1 } });

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.createOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("createManyOnSheet が無いコンテキストでは従来どおり 1 件ずつ追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runOps(
      sheets,
      { connect: [{ id: 2 }, { id: 1 }] },
      { withCreateMany: false },
    );

    expect(sheets.createOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(1, "PostTags", {
      data: { postId: 1, tagId: 2 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(2, "PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("connect の対象が 1 件でも無ければ junction row を 1 行も追記しない", () => {
    const sheets = makeTagSheets([{ id: 1, name: "TS" }]);

    expect(() => runOps(sheets, { connect: [{ id: 1 }, { id: 999 }] })).toThrow(
      NestedWriteConnectNotFoundError,
    );
    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.junctions).toEqual([]);
  });

  it("connectOrCreate が全て既存なら junction row は 1 回でまとめて追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runOps(sheets, {
      connectOrCreate: [
        { where: { id: 2 }, create: { id: 2, name: "JS" } },
        { where: { id: 1 }, create: { id: 1, name: "TS" } },
      ],
    });

    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("PostTags", {
      data: [
        { postId: 1, tagId: 2 },
        { postId: 1, tagId: 1 },
      ],
    });
  });

  it("connectOrCreate でターゲット作成を挟む場合はシート跨ぎの書き込み順が従来と同じになる", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 3, name: "GAS" },
    ]);

    runOps(sheets, {
      connectOrCreate: [
        { where: { id: 1 }, create: { id: 1, name: "TS" } },
        { where: { id: 9 }, create: { id: 9, name: "New" } },
        { where: { id: 3 }, create: { id: 3, name: "GAS" } },
      ],
    });

    expect(sheets.calls).toEqual([
      "find:Tags",
      "create:PostTags",
      "create:Tags",
      "createMany:PostTags",
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 9 },
      { postId: 1, tagId: 3 },
    ]);
    expect(sheets.tags.map((row) => row.id)).toEqual([1, 3, 9]);
  });

  it("再読の前に溜めた junction row を書き出すので読み書き順が従来と同じになる", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, {
      connectOrCreate: [
        { where: { name: "TS" }, create: { id: 5, name: "TS" } },
        { where: { name: "TS" }, create: { id: 6, name: "TS" } },
      ],
    });

    expect(sheets.calls).toEqual([
      "find:Tags",
      "create:Tags",
      "create:PostTags",
      "find:Tags",
      "create:PostTags",
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 5 },
      { postId: 1, tagId: 5 },
    ]);
    expect(sheets.tags).toEqual([{ id: 5, name: "TS" }]);
  });

  it("スナップショットで判定できない where の読みの前にも junction row を書き出す", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runOps(sheets, {
      connectOrCreate: [
        { where: { id: 2 }, create: { id: 2, name: "JS" } },
        { where: { unknown: 1 }, create: { id: 8, name: "X" } },
        { where: { id: 1 }, create: { id: 1, name: "TS" } },
      ],
    });

    expect(sheets.calls).toEqual([
      "find:Tags",
      "create:PostTags",
      "find:Tags",
      "createMany:PostTags",
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 2 },
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 1 },
    ]);
  });

  it("自己 junction は従来どおり 1 件ずつ追記される", () => {
    const selfJunction: RelationDefinition = {
      type: "manyToMany",
      to: "Tags",
      field: "id",
      reference: "id",
      through: { sheet: "Tags", field: "postId", reference: "tagId" },
    };
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runOps(
      sheets,
      { connect: [{ id: 1 }, { id: 2 }] },
      { relation: selfJunction },
    );

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(2);
  });

  it("junction の値がセル値として扱えない場合は従来どおり 1 件ずつ追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runOps(
      sheets,
      { connect: [{ id: 1 }, { id: 2 }] },
      { parent: { title: "記事A" } },
    );

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.junctions).toEqual([
      { postId: undefined, tagId: 1 },
      { postId: undefined, tagId: 2 },
    ]);
  });

  it("null の junction 値はバッチ経路でもそのまま追記される", () => {
    const sheets = makeTagSheets([
      { id: null, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runOps(sheets, { connect: [{ name: "TS" }, { id: 2 }] });

    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("PostTags", {
      data: [
        { postId: 1, tagId: null },
        { postId: 1, tagId: 2 },
      ],
    });
  });

  it("create（配列）は従来どおり 1 件ずつターゲットと junction を作る", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, {
      create: [
        { id: 1, name: "TS" },
        { id: 2, name: "JS" },
      ],
    });

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.calls).toEqual([
      "create:Tags",
      "create:PostTags",
      "create:Tags",
      "create:PostTags",
    ]);
  });
});
