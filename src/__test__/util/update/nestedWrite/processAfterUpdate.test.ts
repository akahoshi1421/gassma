import { processAfterUpdate } from "../../../../util/update/nestedWrite/processAfterUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processAfterUpdate", () => {
  const mockFindMany = jest.fn();
  const mockUpdateManyOnSheet = jest.fn();
  const mockDeleteManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    updateManyOnSheet: mockUpdateManyOnSheet,
    deleteManyOnSheet: mockDeleteManyOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockUpdateManyOnSheet.mockReset();
    mockDeleteManyOnSheet.mockReset();
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

  it("oneToMany + update（単一）で子レコードが更新される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      update: { where: { id: 5 }, data: { title: "新タイトル" } },
    });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
      data: { title: "新タイトル" },
    });
  });

  it("oneToMany + update（配列）で複数更新", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      update: [
        { where: { id: 5 }, data: { title: "新タイトルA" } },
        { where: { id: 6 }, data: { title: "新タイトルB" } },
      ],
    });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledTimes(2);
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
      data: { title: "新タイトルA" },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 6, authorId: 1 },
      data: { title: "新タイトルB" },
    });
  });

  it("oneToMany + delete で子レコードが削除される", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { delete: { id: 5 } });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
    });
  });

  it("oneToMany + delete（配列）で複数削除", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { delete: [{ id: 5 }, { id: 6 }] });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledTimes(2);
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
    });
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 6, authorId: 1 },
    });
  });

  it("oneToMany + deleteMany で複数削除", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 3 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { deleteMany: { published: false } });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { published: false, authorId: 1 },
    });
  });

  it("oneToMany + deleteMany（配列）で複数条件削除", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      deleteMany: [{ published: false }, { title: "下書き" }],
    });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledTimes(2);
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { published: false, authorId: 1 },
    });
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { title: "下書き", authorId: 1 },
    });
  });

  it("oneToMany + disconnect（単一）で子の FK が null になる", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { disconnect: { id: 5 } });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
      data: { authorId: null },
    });
  });

  it("oneToMany + disconnect（配列）で複数子の FK が null になる", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { disconnect: [{ id: 5 }, { id: 6 }] });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledTimes(2);
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
      data: { authorId: null },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 6, authorId: 1 },
      data: { authorId: null },
    });
  });

  it("oneToMany + set で既存子の FK が null になり、指定子の FK がセットされる", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { set: [{ id: 10 }, { id: 11 }] });

    processAfterUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    // 1回目: 既存子を全切断
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { authorId: 1 },
      data: { authorId: null },
    });
    // 2回目・3回目: 指定子を接続
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
      data: { authorId: 1 },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 11 },
      data: { authorId: 1 },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledTimes(3);
  });

  it("oneToMany + disconnect: true でエラー", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { disconnect: true });

    expect(() =>
      processAfterUpdate(
        { id: 1, name: "田中" },
        relationOps,
        makeContext({ posts: oneToManyRelation }),
      ),
    ).toThrow("disconnect");
  });

  it("manyToOne は無視される", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { update: { name: "佐藤" } });

    processAfterUpdate(
      { id: 10, title: "記事A" },
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
  });
});
