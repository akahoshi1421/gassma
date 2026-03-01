import { processManyToMany } from "../../../../util/create/nestedWrite/processManyToMany";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processManyToMany", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();
  const mockCreateManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    createOnSheet: mockCreateOnSheet,
    createManyOnSheet: mockCreateManyOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateOnSheet.mockReset();
    mockCreateManyOnSheet.mockReset();
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

  it("create でターゲット作成 + junction row が作成される", () => {
    mockCreateOnSheet
      .mockReturnValueOnce({ id: 1, name: "TypeScript" })
      .mockReturnValueOnce({ postId: 1, tagId: 1 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { create: { name: "TypeScript" } });

    processManyToMany(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockCreateOnSheet).toHaveBeenCalledWith("Tags", {
      data: { name: "TypeScript" },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("create（配列）で複数ターゲット + 複数 junction row が作成される", () => {
    mockCreateOnSheet
      .mockReturnValueOnce({ id: 1, name: "TypeScript" })
      .mockReturnValueOnce({ postId: 1, tagId: 1 })
      .mockReturnValueOnce({ id: 2, name: "JavaScript" })
      .mockReturnValueOnce({ postId: 1, tagId: 2 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", {
      create: [{ name: "TypeScript" }, { name: "JavaScript" }],
    });

    processManyToMany(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockCreateOnSheet).toHaveBeenCalledTimes(4);
  });

  it("connect で junction row が作成される", () => {
    mockFindMany.mockReturnValue([{ id: 1, name: "TypeScript" }]);
    mockCreateOnSheet.mockReturnValue({ postId: 1, tagId: 1 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { connect: { id: 1 } });

    processManyToMany(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockFindMany).toHaveBeenCalledWith("Tags", {
      where: { id: 1 },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("connect でレコードが見つからない場合エラーを投げる", () => {
    mockFindMany.mockReturnValue([]);

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", { connect: { id: 999 } });

    expect(() =>
      processManyToMany(
        { id: 1, title: "記事A" },
        relationOps,
        makeContext({ tags: manyToManyRelation }),
      ),
    ).toThrow("Tags");
  });

  it("connectOrCreate で既存レコードがある場合 junction row のみ作成される", () => {
    mockFindMany.mockReturnValue([{ id: 1, name: "TypeScript" }]);
    mockCreateOnSheet.mockReturnValue({ postId: 1, tagId: 1 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", {
      connectOrCreate: {
        where: { id: 1 },
        create: { id: 1, name: "TypeScript" },
      },
    });

    processManyToMany(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockFindMany).toHaveBeenCalledWith("Tags", {
      where: { id: 1 },
    });
    // junction row のみ作成、ターゲットは作成されない
    expect(mockCreateOnSheet).toHaveBeenCalledTimes(1);
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("connectOrCreate で既存レコードがない場合ターゲット作成 + junction row が作成される", () => {
    mockFindMany.mockReturnValue([]);
    mockCreateOnSheet
      .mockReturnValueOnce({ id: 1, name: "TypeScript" })
      .mockReturnValueOnce({ postId: 1, tagId: 1 });

    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("tags", {
      connectOrCreate: {
        where: { id: 1 },
        create: { id: 1, name: "TypeScript" },
      },
    });

    processManyToMany(
      { id: 1, title: "記事A" },
      relationOps,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(mockCreateOnSheet).toHaveBeenCalledWith("Tags", {
      data: { id: 1, name: "TypeScript" },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });
});
