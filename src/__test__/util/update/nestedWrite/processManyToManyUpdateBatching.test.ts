import type { AnyUse, WhereUse } from "../../../../types/coreTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { processManyToManyUpdate } from "../../../../util/update/nestedWrite/processManyToManyUpdate";

type Row = Record<string, unknown>;

const matchesPlain = (record: Row, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([key, value]) => {
    if (!(key in record)) return true;
    if (value !== null && typeof value === "object") return false;
    const wanted = value === "" ? null : value;
    return record[key] === wanted;
  });

const makeTagSheets = (initialTags: Row[], initialJunctions: Row[] = []) => {
  const tags: Row[] = initialTags.map((row) => ({ ...row }));
  const junctions: Row[] = initialJunctions.map((row) => ({ ...row }));
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
    calls.push(`create:${sheet}`);
    const record = { ...createData.data };
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

  const deleteManyOnSheet = jest.fn(
    (sheet: string, deleteData: { where: WhereUse }) => {
      calls.push(`deleteMany:${sheet}`);
      const before = junctions.length;
      const remaining = junctions.filter(
        (row) => !matchesPlain(row, deleteData.where),
      );
      junctions.splice(0, junctions.length);
      remaining.forEach((row) => {
        junctions.push(row);
      });
      return { count: before - junctions.length };
    },
  );

  return {
    tags,
    junctions,
    calls,
    findManyOnSheet,
    createOnSheet,
    createManyOnSheet,
    deleteManyOnSheet,
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
  relationNames?: string[];
  parent?: Row;
};

const runSet = (
  sheets: ReturnType<typeof makeTagSheets>,
  set: WhereUse[],
  options: RunOptions = {},
) => {
  const relation = options.relation ?? tagsRelation;
  const relationOps = new Map<string, NestedWriteOperation>();
  relationOps.set("tags", { set });
  const context: RelationContext = {
    relations: { tags: relation },
    findManyOnSheet: sheets.findManyOnSheet,
    createOnSheet: sheets.createOnSheet,
    deleteManyOnSheet: sheets.deleteManyOnSheet,
  };
  if (options.withCreateMany !== false) {
    context.createManyOnSheet = sheets.createManyOnSheet;
  }
  if (options.relationNames) {
    const names = options.relationNames;
    context.relationNamesOnSheet = () => names;
  }
  processManyToManyUpdate(
    options.parent ?? { id: 1, title: "記事A" },
    relationOps,
    context,
  );
};

describe("processManyToManyUpdate set のバッチ化", () => {
  it("複数 set は読み 1 回・junction row は 1 回の createManyOnSheet で items 順に追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
      { id: 3, name: "GAS" },
    ]);

    runSet(sheets, [{ id: 3 }, { id: 1 }, { id: 2 }]);

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {});
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

  it("既存 junction row の全削除はスナップショット読みより前に行われる", () => {
    const sheets = makeTagSheets(
      [
        { id: 1, name: "TS" },
        { id: 2, name: "JS" },
      ],
      [
        { postId: 1, tagId: 9 },
        { postId: 2, tagId: 1 },
      ],
    );

    runSet(sheets, [{ id: 2 }, { id: 1 }]);

    expect(sheets.calls).toEqual([
      "deleteMany:PostTags",
      "find:Tags",
      "createMany:PostTags",
    ]);
    expect(sheets.junctions).toEqual([
      { postId: 2, tagId: 1 },
      { postId: 1, tagId: 2 },
      { postId: 1, tagId: 1 },
    ]);
  });

  it("見つからない項目はバッチでもスキップされ残りが items 順に追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runSet(sheets, [{ id: 1 }, { id: 999 }, { id: 2 }]);

    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("PostTags", {
      data: [
        { postId: 1, tagId: 1 },
        { postId: 1, tagId: 2 },
      ],
    });
  });

  it("全項目が見つからない場合は junction row を 1 行も追記しない", () => {
    const sheets = makeTagSheets([{ id: 1, name: "TS" }]);

    runSet(sheets, [{ id: 998 }, { id: 999 }]);

    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.junctions).toEqual([]);
  });

  it("複数行にマッチする where は先頭行が使われる", () => {
    const sheets = makeTagSheets([
      { id: 1, group: "a" },
      { id: 2, group: "a" },
      { id: 3, group: "b" },
    ]);

    runSet(sheets, [{ group: "a" }, { id: 3 }]);

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 3 },
    ]);
  });

  it("set が 1 件のときは従来どおり個別読みと createOnSheet で追記される", () => {
    const sheets = makeTagSheets([{ id: 1, name: "TS" }]);

    runSet(sheets, [{ id: 1 }]);

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { id: 1 },
    });
    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("自己 junction は従来どおり個別読みで追記される", () => {
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

    runSet(sheets, [{ id: 1 }, { id: 2 }], { relation: selfJunction });

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { id: 1 },
    });
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { id: 2 },
    });
  });

  it("createManyOnSheet が無いコンテキストでは従来どおり個別読みで追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runSet(sheets, [{ id: 2 }, { id: 1 }], { withCreateMany: false });

    expect(sheets.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { id: 2 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(1, "PostTags", {
      data: { postId: 1, tagId: 2 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(2, "PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("スナップショットで判定できない where はその項目だけ個別読みに戻す", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runSet(sheets, [{ id: 1 }, { unknown: 9 }, { id: 2 }]);

    expect(sheets.calls).toEqual([
      "deleteMany:PostTags",
      "find:Tags",
      "find:Tags",
      "createMany:PostTags",
    ]);
    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { unknown: 9 },
    });
    expect(sheets.junctions).toEqual([
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 1 },
      { postId: 1, tagId: 2 },
    ]);
  });

  it("関係名のキーを含む where はその項目だけ個別読みに戻す", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runSet(sheets, [{ id: 1 }, { posts: { some: { id: 5 } } }], {
      relationNames: ["posts"],
    });

    expect(sheets.findManyOnSheet).toHaveBeenCalledWith("Tags", {
      where: { posts: { some: { id: 5 } } },
    });
    expect(sheets.calls).toEqual([
      "deleteMany:PostTags",
      "find:Tags",
      "find:Tags",
      "createMany:PostTags",
    ]);
  });

  it("親の値がセル値でない場合は junction row が従来どおり 1 件ずつ追記される", () => {
    const sheets = makeTagSheets([
      { id: 1, name: "TS" },
      { id: 2, name: "JS" },
    ]);

    runSet(sheets, [{ id: 1 }, { id: 2 }], { parent: { title: "記事A" } });

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.junctions).toEqual([
      { postId: undefined, tagId: 1 },
      { postId: undefined, tagId: 2 },
    ]);
  });
});
