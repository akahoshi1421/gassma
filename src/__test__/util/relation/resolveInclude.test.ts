import { resolveInclude } from "../../../util/relation/resolveInclude";
import type {
  IncludeData,
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";

describe("resolveInclude", () => {
  const relations: { [name: string]: RelationDefinition } = {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
    profile: {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    },
  };

  const mockFindMany = jest.fn();

  const context: RelationContext = {
    relations,
    findManyOnSheet: mockFindMany,
  };

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("include: true で基本的なリレーション解決ができる", () => {
    const parents = [{ id: 1, name: "Alice" }];
    const include: IncludeData = { posts: true };

    mockFindMany.mockReturnValue([{ id: 101, authorId: 1, title: "Post A" }]);

    const result = resolveInclude(parents, include, context);

    expect(result[0]).toEqual({
      id: 1,
      name: "Alice",
      posts: [{ id: 101, authorId: 1, title: "Post A" }],
    });
  });

  it("複数のリレーションを同時に解決できる", () => {
    const parents = [{ id: 1, name: "Alice" }];
    const include: IncludeData = { posts: true, profile: true };

    // postsのfindMany
    mockFindMany.mockReturnValueOnce([
      { id: 101, authorId: 1, title: "Post A" },
    ]);
    // profileのfindMany
    mockFindMany.mockReturnValueOnce([{ id: 10, userId: 1, bio: "Hello" }]);

    const result = resolveInclude(parents, include, context);

    expect(result[0].posts).toEqual([
      { id: 101, authorId: 1, title: "Post A" },
    ]);
    expect(result[0].profile).toEqual({ id: 10, userId: 1, bio: "Hello" });
  });

  it("includeオプション付きで解決できる", () => {
    const parents = [{ id: 1, name: "Alice" }];
    const include: IncludeData = {
      posts: { where: { published: true }, take: 5 },
    };

    mockFindMany.mockReturnValue([
      { id: 101, authorId: 1, title: "Post A", published: true },
    ]);

    const result = resolveInclude(parents, include, context);

    expect(result[0].posts).toEqual([
      { id: 101, authorId: 1, title: "Post A", published: true },
    ]);
  });

  it("未定義のリレーション名を指定するとエラーを投げる", () => {
    const parents = [{ id: 1, name: "Alice" }];
    const include: IncludeData = { unknown: true };

    expect(() => resolveInclude(parents, include, context)).toThrow(
      'Relation "unknown" is not defined',
    );
  });

  it("親レコードが空配列の場合はそのまま返す", () => {
    const include: IncludeData = { posts: true };

    const result = resolveInclude([], include, context);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  describe("manyToOne リレーション", () => {
    const postRelations: { [name: string]: RelationDefinition } = {
      author: {
        type: "manyToOne",
        to: "Users",
        field: "authorId",
        reference: "id",
      },
    };

    const postContext: RelationContext = {
      relations: postRelations,
      findManyOnSheet: mockFindMany,
    };

    it("manyToOneリレーションを解決できる", () => {
      const parents = [{ id: 101, authorId: 1, title: "Post A" }];
      const include: IncludeData = { author: true };

      mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

      const result = resolveInclude(parents, include, postContext);

      expect(result[0]).toEqual({
        id: 101,
        authorId: 1,
        title: "Post A",
        author: { id: 1, name: "Alice" },
      });
    });
  });

  describe("manyToMany リレーション", () => {
    const postRelations: { [name: string]: RelationDefinition } = {
      categories: {
        type: "manyToMany",
        to: "Categories",
        field: "id",
        reference: "id",
        through: {
          sheet: "PostCategories",
          field: "postId",
          reference: "categoryId",
        },
      },
    };

    const postContext: RelationContext = {
      relations: postRelations,
      findManyOnSheet: mockFindMany,
    };

    it("manyToManyリレーションを解決できる", () => {
      const parents = [{ id: 1, title: "Post A" }];
      const include: IncludeData = { categories: true };

      mockFindMany.mockReturnValueOnce([{ postId: 1, categoryId: 10 }]);
      mockFindMany.mockReturnValueOnce([{ id: 10, name: "Tech" }]);

      const result = resolveInclude(parents, include, postContext);

      expect(result[0]).toEqual({
        id: 1,
        title: "Post A",
        categories: [{ id: 10, name: "Tech" }],
      });
    });
  });
});
