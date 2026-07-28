import { NestedWriteConnectNotFoundError } from "../../../../errors/relation/nestedWriteError";
import type { WhereUse } from "../../../../types/coreTypes";
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

  const findManyOnSheet = jest.fn(
    (_sheet: string, findData: { where?: WhereUse }) => {
      const where = findData.where ?? {};
      if (Object.keys(where).length === 0) return tags.map((r) => ({ ...r }));
      return tags
        .filter((row) => matchesPlain(row, where))
        .map((r) => ({ ...r }));
    },
  );

  const createOnSheet = jest.fn((sheet: string, createData: { data: Row }) => {
    const record = { ...createData.data };
    if (sheet === "PostTags") junctions.push(record);
    else tags.push(record);
    return { ...record };
  });

  return { tags, junctions, findManyOnSheet, createOnSheet };
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

const runOps = (
  sheets: ReturnType<typeof makeTagSheets>,
  ops: NestedWriteOperation,
  relation: RelationDefinition = tagsRelation,
) => {
  const relationOps = new Map<string, NestedWriteOperation>();
  relationOps.set("tags", ops);
  const context: RelationContext = {
    relations: { tags: relation },
    findManyOnSheet: sheets.findManyOnSheet,
    createOnSheet: sheets.createOnSheet,
  };
  processManyToMany({ id: 1, title: "記事A" }, relationOps, context);
};

describe("processManyToMany connect のバッチ化", () => {
  it("複数 connect は読み 1 回で junction row は items 順に作られる", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
      { id: 3, name: "GAS" },
    ]);

    runOps(sheets, { connect: [{ id: 3 }, { id: 1 }, { id: 2 }] });

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {});
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(3);
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(1, "PostTags", {
      data: { postId: 1, tagId: 3 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(2, "PostTags", {
      data: { postId: 1, tagId: 1 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(3, "PostTags", {
      data: { postId: 1, tagId: 2 },
    });
  });

  it("1件でも不在なら junction row を 1 行も作らずエラーを投げる", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);
    const run = () =>
      runOps(sheets, { connect: [{ id: 1 }, { id: 2 }, { id: 999 }] });

    expect(run).toThrow(NestedWriteConnectNotFoundError);
    expect(run).toThrow(
      'Nested write connect failed: no record found in "Tags"',
    );
    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.junctions).toEqual([]);
  });

  it("複数行にマッチする where は先頭行が使われる", () => {
    const sheets = makeTagSheets([
      { id: 1, group: "a" },
      { id: 2, group: "a" },
      { id: 3, group: "b" },
    ]);

    runOps(sheets, { connect: [{ group: "a" }, { id: 3 }] });

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 3 },
    ]);
  });
});

describe("processManyToMany connectOrCreate のバッチ化", () => {
  it("既存と不在の混在では読み 1 回・junction は items 順", () => {
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

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {});
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(1, "PostTags", {
      data: { postId: 1, tagId: 1 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(2, "Tags", {
      data: { id: 9, name: "New" },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(3, "PostTags", {
      data: { postId: 1, tagId: 9 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(4, "PostTags", {
      data: { postId: 1, tagId: 3 },
    });
    expect(sheets.tags.map((row) => row.id)).toEqual([1, 3, 9]);
  });

  it("同一 where の重複項目はターゲットを 2 重作成しない", () => {
    const sheets = makeTagSheets([]);

    runOps(sheets, {
      connectOrCreate: [
        { where: { name: "TS" }, create: { id: 5, name: "TS" } },
        { where: { name: "TS" }, create: { id: 6, name: "TS" } },
      ],
    });

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.tags).toEqual([{ id: 5, name: "TS" }]);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 5 },
      { postId: 1, tagId: 5 },
    ]);
  });
});

describe("processManyToMany 自己 junction のフォールバック", () => {
  it("through.sheet がターゲットと同じ場合は従来の個別読みに戻す", () => {
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

    runOps(sheets, { connect: [{ id: 1 }, { id: 2 }] }, selfJunction);

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { id: 1 },
    });
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { id: 2 },
    });
  });
});
