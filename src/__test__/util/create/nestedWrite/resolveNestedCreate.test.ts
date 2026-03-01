import { resolveNestedCreate } from "../../../../util/create/nestedWrite/resolveNestedCreate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";

describe("resolveNestedCreate", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();
  const mockCreateManyOnSheet = jest.fn();
  const mockUpdateManyOnSheet = jest.fn();
  const mockCreateFunc = jest.fn();

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
    mockCreateFunc.mockReset();
  });

  const manyToOneRelation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  const oneToManyRelation: RelationDefinition = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

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

  it("リレーションフィールドがない場合は通常の createFunc が実行される", () => {
    mockCreateFunc.mockReturnValue({ id: 1, title: "記事A" });

    const result = resolveNestedCreate(
      { title: "記事A" },
      mockCreateFunc,
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ id: 1, title: "記事A" });
    expect(mockCreateFunc).toHaveBeenCalledWith({ title: "記事A" });
  });

  it("manyToOne + connect の完全フロー", () => {
    mockFindMany.mockReturnValue([{ id: 1, name: "田中" }]);
    mockCreateFunc.mockReturnValue({ id: 10, title: "記事A", authorId: 1 });

    const result = resolveNestedCreate(
      { title: "記事A", author: { connect: { id: 1 } } },
      mockCreateFunc,
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ id: 10, title: "記事A", authorId: 1 });
    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: 1 },
    });
    expect(mockCreateFunc).toHaveBeenCalledWith({
      title: "記事A",
      authorId: 1,
    });
  });

  it("oneToMany + create の完全フロー", () => {
    mockCreateFunc.mockReturnValue({ id: 1, name: "田中" });
    mockCreateOnSheet.mockReturnValue({
      id: 10,
      title: "記事A",
      authorId: 1,
    });

    const result = resolveNestedCreate(
      { name: "田中", posts: { create: { title: "記事A" } } },
      mockCreateFunc,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockCreateFunc).toHaveBeenCalledWith({ name: "田中" });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事A", authorId: 1 },
    });
  });

  it("manyToMany + create の完全フロー", () => {
    mockCreateFunc.mockReturnValue({ id: 1, title: "記事A" });
    mockCreateOnSheet
      .mockReturnValueOnce({ id: 1, name: "TypeScript" })
      .mockReturnValueOnce({ postId: 1, tagId: 1 });

    const result = resolveNestedCreate(
      { title: "記事A", tags: { create: { name: "TypeScript" } } },
      mockCreateFunc,
      makeContext({ tags: manyToManyRelation }),
    );

    expect(result).toEqual({ id: 1, title: "記事A" });
    expect(mockCreateFunc).toHaveBeenCalledWith({ title: "記事A" });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Tags", {
      data: { name: "TypeScript" },
    });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("PostTags", {
      data: { postId: 1, tagId: 1 },
    });
  });

  it("複合: manyToOne + oneToMany 同時処理", () => {
    mockFindMany.mockReturnValue([{ id: 5, name: "佐藤" }]);
    mockCreateFunc.mockReturnValue({
      id: 10,
      title: "記事A",
      authorId: 5,
    });
    mockCreateOnSheet.mockReturnValue({
      id: 1,
      content: "コメント",
      postId: 10,
    });

    const commentsRelation: RelationDefinition = {
      type: "oneToMany",
      to: "Comments",
      field: "id",
      reference: "postId",
    };

    const result = resolveNestedCreate(
      {
        title: "記事A",
        author: { connect: { id: 5 } },
        comments: { create: { content: "コメント" } },
      },
      mockCreateFunc,
      makeContext({
        author: manyToOneRelation,
        comments: commentsRelation,
      }),
    );

    expect(result).toEqual({ id: 10, title: "記事A", authorId: 5 });
    // manyToOne: beforeCreate で FK 設定
    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: 5 },
    });
    expect(mockCreateFunc).toHaveBeenCalledWith({
      title: "記事A",
      authorId: 5,
    });
    // oneToMany: afterCreate で子レコード作成
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Comments", {
      data: { content: "コメント", postId: 10 },
    });
  });

  it("RelationContext なしで nested write を使うとエラーを投げる", () => {
    expect(() =>
      resolveNestedCreate(
        { title: "記事A", author: { connect: { id: 1 } } },
        mockCreateFunc,
        undefined,
      ),
    ).toThrow("Cannot use nested write");
  });
});
