import { processManyToManyUpdate } from "../../../../util/update/nestedWrite/processManyToManyUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processManyToManyUpdate", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();
  const mockDeleteManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    createOnSheet: mockCreateOnSheet,
    deleteManyOnSheet: mockDeleteManyOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateOnSheet.mockReset();
    mockDeleteManyOnSheet.mockReset();
  });

  const manyToManyRelation: RelationDefinition = {
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

  const oneToManyRelation: RelationDefinition = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

  it("manyToMany + disconnect で中間テーブルの行が削除される", () => {
    mockFindMany.mockReturnValue([{ id: 3, name: "TypeScript" }]);
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { disconnect: { id: 3 } });

    processManyToManyUpdate(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockFindMany).toHaveBeenCalledWith("Tags", { where: { id: 3 } });
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("PostTags", {
      where: { postId: 1, tagId: 3 },
    });
  });

  it("manyToMany + disconnect（配列）で複数行削除", () => {
    mockFindMany
      .mockReturnValueOnce([{ id: 3, name: "TypeScript" }])
      .mockReturnValueOnce([{ id: 5, name: "JavaScript" }]);
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { disconnect: [{ id: 3 }, { id: 5 }] });

    processManyToManyUpdate(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledTimes(2);
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("PostTags", {
      where: { postId: 1, tagId: 3 },
    });
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("PostTags", {
      where: { postId: 1, tagId: 5 },
    });
  });

  it("manyToMany + disconnect で対象が見つからない場合スキップ", () => {
    mockFindMany.mockReturnValue([]);

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { disconnect: { id: 999 } });

    processManyToManyUpdate(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
  });

  it("manyToMany + set で既存行が全削除され新規行が作成される", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 2 });
    mockFindMany
      .mockReturnValueOnce([{ id: 10, name: "React" }])
      .mockReturnValueOnce([{ id: 11, name: "Vue" }]);
    mockCreateOnSheet.mockReturnValue({});

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { set: [{ id: 10 }, { id: 11 }] });

    processManyToManyUpdate(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    // 既存行の全削除
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("PostTags", {
      where: { postId: 1 },
    });
    // 新規行の作成
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 10 },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 11 },
    });
  });

  it("manyToMany 以外は無視される", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { disconnect: { id: 5 } });

    processManyToManyUpdate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });
});
