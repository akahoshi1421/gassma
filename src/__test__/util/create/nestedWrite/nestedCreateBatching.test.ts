import { NestedWriteWithoutRelationsError } from "../../../../errors/relation/nestedWriteError";
import type { AnyUse } from "../../../../types/coreTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { processAfterCreate } from "../../../../util/create/nestedWrite/processAfterCreate";
import { resolveNestedCreate } from "../../../../util/create/nestedWrite/resolveNestedCreate";

type Row = Record<string, unknown>;

const makeSheets = () => {
  const posts: Row[] = [];
  const calls: string[] = [];

  const createOnSheet = jest.fn((sheet: string, createData: { data: Row }) => {
    calls.push(`create:${sheet}`);
    const record = { ...createData.data };
    posts.push(record);
    return { ...record };
  });

  const createManyOnSheet = jest.fn(
    (sheet: string, createManyData: { data: AnyUse[] }) => {
      calls.push(`createMany:${sheet}`);
      createManyData.data.forEach((row) => {
        posts.push({ ...row });
      });
      return { count: createManyData.data.length };
    },
  );

  return { posts, calls, createOnSheet, createManyOnSheet };
};

const postsRelation: RelationDefinition = {
  type: "oneToMany",
  to: "Posts",
  field: "id",
  reference: "authorId",
};

const runCreate = (
  sheets: ReturnType<typeof makeSheets>,
  create: NestedWriteOperation["create"],
  withCreateMany = true,
) => {
  const relationOps = new Map<string, NestedWriteOperation>();
  relationOps.set("posts", { create });
  const context: RelationContext = {
    relations: { posts: postsRelation },
    findManyOnSheet: jest.fn(),
    createOnSheet: sheets.createOnSheet,
  };
  if (withCreateMany) context.createManyOnSheet = sheets.createManyOnSheet;
  processAfterCreate({ id: 1, name: "田中" }, relationOps, context);
};

describe("oneToMany nested create の追記バッチ化", () => {
  it("複数項目は 1 回の createManyOnSheet にまとまり FK と順序が保たれる", () => {
    const sheets = makeSheets();

    runCreate(sheets, [{ title: "記事A" }, { title: "記事B" }]);

    expect(sheets.createOnSheet).not.toHaveBeenCalled();
    expect(sheets.createManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("Posts", {
      data: [
        { title: "記事A", authorId: 1 },
        { title: "記事B", authorId: 1 },
      ],
    });
  });

  it("項目が 1 件のときは従来どおり createOnSheet で作られる", () => {
    const sheets = makeSheets();

    runCreate(sheets, [{ title: "記事A" }]);

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事A", authorId: 1 },
    });
  });

  it("配列でない単一の create も従来どおり createOnSheet で作られる", () => {
    const sheets = makeSheets();

    runCreate(sheets, { title: "記事A" });

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事A", authorId: 1 },
    });
  });

  it("1 項目でも nested write を含むならリレーション全体を 1 件ずつ作る", () => {
    const sheets = makeSheets();

    runCreate(sheets, [
      { title: "記事A" },
      { title: "記事B", comments: { create: [{ body: "コメント" }] } },
      { title: "記事C" },
    ]);

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(3);
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(1, "Posts", {
      data: { title: "記事A", authorId: 1 },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(2, "Posts", {
      data: {
        title: "記事B",
        comments: { create: [{ body: "コメント" }] },
        authorId: 1,
      },
    });
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(3, "Posts", {
      data: { title: "記事C", authorId: 1 },
    });
  });

  it("nested write を含む項目では従来どおり NestedWriteWithoutRelationsError が投げられる", () => {
    const sheets = makeSheets();
    sheets.createOnSheet.mockImplementation(
      (sheet: string, createData: { data: Row }) => {
        sheets.calls.push(`create:${sheet}`);
        const created = resolveNestedCreate(
          createData.data,
          (scalarData) => ({ ...scalarData }),
          undefined,
        );
        sheets.posts.push(created);
        return created;
      },
    );

    expect(() =>
      runCreate(sheets, [
        { title: "記事A" },
        { title: "記事B", comments: { create: [{ body: "コメント" }] } },
      ]),
    ).toThrow(NestedWriteWithoutRelationsError);
    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.posts).toEqual([{ title: "記事A", authorId: 1 }]);
  });

  it("createManyOnSheet が無いコンテキストでは従来どおり 1 件ずつ作られる", () => {
    const sheets = makeSheets();

    runCreate(sheets, [{ title: "記事A" }, { title: "記事B" }], false);

    expect(sheets.createOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.calls).toEqual(["create:Posts", "create:Posts"]);
  });

  it("セル値として扱えない値を含む項目は従来どおり 1 件ずつ作られる", () => {
    const sheets = makeSheets();

    runCreate(sheets, [{ title: "記事A" }, { title: undefined }]);

    expect(sheets.createManyOnSheet).not.toHaveBeenCalled();
    expect(sheets.createOnSheet).toHaveBeenCalledTimes(2);
    expect(sheets.createOnSheet).toHaveBeenNthCalledWith(2, "Posts", {
      data: { title: undefined, authorId: 1 },
    });
  });

  it("項目が FK 列を持っていても親の値で上書きされる", () => {
    const sheets = makeSheets();

    runCreate(sheets, [{ title: "記事A", authorId: 999 }, { title: "記事B" }]);

    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("Posts", {
      data: [
        { title: "記事A", authorId: 1 },
        { title: "記事B", authorId: 1 },
      ],
    });
  });

  it("Date や null はそのままバッチ経路で書かれる", () => {
    const sheets = makeSheets();
    const publishedAt = new Date("2026-07-30T00:00:00Z");

    runCreate(sheets, [
      { title: "記事A", publishedAt },
      { title: "記事B", publishedAt: null },
    ]);

    expect(sheets.createManyOnSheet).toHaveBeenCalledWith("Posts", {
      data: [
        { title: "記事A", publishedAt, authorId: 1 },
        { title: "記事B", publishedAt: null, authorId: 1 },
      ],
    });
  });
});
