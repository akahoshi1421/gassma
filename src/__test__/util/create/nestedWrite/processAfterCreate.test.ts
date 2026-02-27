import { processAfterCreate } from "../../../../util/create/nestedWrite/processAfterCreate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processAfterCreate", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();
  const mockCreateManyOnSheet = jest.fn();
  const mockUpdateManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    createOnSheet: mockCreateOnSheet,
    createManyOnSheet: mockCreateManyOnSheet,
    updateManyOnSheet: mockUpdateManyOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateOnSheet.mockReset();
    mockCreateManyOnSheet.mockReset();
    mockUpdateManyOnSheet.mockReset();
  });

  const oneToManyRelation: RelationDefinition = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

  const manyToOneRelation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  it("oneToMany + create（単一）で子レコードにFKが自動設定されて作成される", () => {
    mockCreateOnSheet.mockReturnValue({ id: 10, title: "記事A", authorId: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { create: { title: "記事A" } });

    processAfterCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockCreateOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事A", authorId: 1 },
    });
  });

  it("oneToMany + create（配列）で複数の子レコードが作成される", () => {
    mockCreateOnSheet
      .mockReturnValueOnce({ id: 10, title: "記事A", authorId: 1 })
      .mockReturnValueOnce({ id: 11, title: "記事B", authorId: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      create: [{ title: "記事A" }, { title: "記事B" }],
    });

    processAfterCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockCreateOnSheet).toHaveBeenCalledTimes(2);
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事A", authorId: 1 },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事B", authorId: 1 },
    });
  });

  it("oneToMany + createMany で createManyOnSheet が呼び出される", () => {
    mockCreateManyOnSheet.mockReturnValue({ count: 2 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      createMany: { data: [{ title: "記事A" }, { title: "記事B" }] },
    });

    processAfterCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockCreateManyOnSheet).toHaveBeenCalledWith("Posts", {
      data: [
        { title: "記事A", authorId: 1 },
        { title: "記事B", authorId: 1 },
      ],
    });
  });

  it("oneToMany + connect で既存レコードのFKが更新される", () => {
    mockFindMany.mockReturnValue([{ id: 10, title: "記事A", authorId: null }]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { connect: { id: 10 } });

    processAfterCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockFindMany).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
      data: { authorId: 1 },
    });
  });

  it("oneToMany + connect でレコードが見つからない場合エラーを投げる", () => {
    mockFindMany.mockReturnValue([]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { connect: { id: 999 } });

    expect(() =>
      processAfterCreate(
        { id: 1, name: "田中" },
        relationOps,
        makeContext({ posts: oneToManyRelation }),
      ),
    ).toThrow("Posts");
  });

  it("oneToMany + connectOrCreate で既存レコードがある場合FK更新される", () => {
    mockFindMany.mockReturnValue([{ id: 10, title: "記事A", authorId: null }]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      connectOrCreate: {
        where: { id: 10 },
        create: { id: 10, title: "記事A" },
      },
    });

    processAfterCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockFindMany).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
      data: { authorId: 1 },
    });
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("oneToMany + connectOrCreate で既存レコードがない場合新規作成される", () => {
    mockFindMany.mockReturnValue([]);
    mockCreateOnSheet.mockReturnValue({
      id: 10,
      title: "記事A",
      authorId: 1,
    });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      connectOrCreate: {
        where: { id: 10 },
        create: { id: 10, title: "記事A" },
      },
    });

    processAfterCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockFindMany).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Posts", {
      data: { id: 10, title: "記事A", authorId: 1 },
    });
  });

  it("manyToOne のリレーションは無視される", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { connect: { id: 1 } });

    processAfterCreate(
      { id: 10, title: "記事A" },
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });
});
