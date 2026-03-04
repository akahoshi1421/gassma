import { resolveCount } from "../../../util/relation/resolveCount";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";

describe("resolveCount", () => {
  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  describe("oneToMany", () => {
    const relations: { [name: string]: RelationDefinition } = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      },
    };

    const context: RelationContext = {
      relations,
      findManyOnSheet: mockFindMany,
    };

    test("親2件に対して子を正しくカウントする", () => {
      const parents = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      mockFindMany.mockReturnValue([
        { id: 101, authorId: 1, title: "Post A" },
        { id: 102, authorId: 1, title: "Post B" },
        { id: 103, authorId: 2, title: "Post C" },
      ]);

      const result = resolveCount(
        parents,
        { select: { posts: true } },
        context,
      );

      expect(result[0]._count).toEqual({ posts: 2 });
      expect(result[1]._count).toEqual({ posts: 1 });
    });

    test("子が0件の場合に 0 を返す", () => {
      const parents = [{ id: 1, name: "Alice" }];

      mockFindMany.mockReturnValue([]);

      const result = resolveCount(
        parents,
        { select: { posts: true } },
        context,
      );

      expect(result[0]._count).toEqual({ posts: 0 });
    });

    test("where フィルタ付きでフィルタ合致のみカウントする", () => {
      const parents = [{ id: 1, name: "Alice" }];

      mockFindMany.mockReturnValue([
        { id: 101, authorId: 1, title: "Post A", published: true },
      ]);

      const result = resolveCount(
        parents,
        { select: { posts: { where: { published: true } } } },
        context,
      );

      expect(result[0]._count).toEqual({ posts: 1 });
      expect(mockFindMany).toHaveBeenCalledWith("Posts", {
        where: { AND: [{ authorId: { in: [1] } }, { published: true }] },
      });
    });
  });

  describe("oneToOne", () => {
    const relations: { [name: string]: RelationDefinition } = {
      profile: {
        type: "oneToOne",
        to: "Profiles",
        field: "id",
        reference: "userId",
      },
    };

    const context: RelationContext = {
      relations,
      findManyOnSheet: mockFindMany,
    };

    test("存在する場合 1、存在しない場合 0 を返す", () => {
      const parents = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      mockFindMany.mockReturnValue([{ id: 10, userId: 1, bio: "Hello" }]);

      const result = resolveCount(
        parents,
        { select: { profile: true } },
        context,
      );

      expect(result[0]._count).toEqual({ profile: 1 });
      expect(result[1]._count).toEqual({ profile: 0 });
    });
  });

  describe("manyToOne", () => {
    const relations: { [name: string]: RelationDefinition } = {
      author: {
        type: "manyToOne",
        to: "Users",
        field: "authorId",
        reference: "id",
      },
    };

    const context: RelationContext = {
      relations,
      findManyOnSheet: mockFindMany,
    };

    test("FK が非 null で対象存在なら 1、null なら 0 を返す", () => {
      const parents = [
        { id: 101, authorId: 1, title: "Post A" },
        { id: 102, authorId: null, title: "Post B" },
      ];

      mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

      const result = resolveCount(
        parents,
        { select: { author: true } },
        context,
      );

      expect(result[0]._count).toEqual({ author: 1 });
      expect(result[1]._count).toEqual({ author: 0 });
    });
  });

  describe("manyToMany", () => {
    const relations: { [name: string]: RelationDefinition } = {
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

    const context: RelationContext = {
      relations,
      findManyOnSheet: mockFindMany,
    };

    test("junction テーブル経由で正しくカウントする", () => {
      const parents = [
        { id: 1, title: "Post A" },
        { id: 2, title: "Post B" },
      ];

      // junction テーブル
      mockFindMany.mockReturnValueOnce([
        { postId: 1, categoryId: 10 },
        { postId: 1, categoryId: 20 },
        { postId: 2, categoryId: 10 },
      ]);

      const result = resolveCount(
        parents,
        { select: { categories: true } },
        context,
      );

      expect(result[0]._count).toEqual({ categories: 2 });
      expect(result[1]._count).toEqual({ categories: 1 });
    });

    test("where フィルタ付きでカウントする", () => {
      const parents = [{ id: 1, title: "Post A" }];

      // junction テーブル
      mockFindMany.mockReturnValueOnce([
        { postId: 1, categoryId: 10 },
        { postId: 1, categoryId: 20 },
      ]);
      // ターゲット（フィルタ後）
      mockFindMany.mockReturnValueOnce([{ id: 10, name: "Tech" }]);

      const result = resolveCount(
        parents,
        { select: { categories: { where: { name: "Tech" } } } },
        context,
      );

      expect(result[0]._count).toEqual({ categories: 1 });
    });
  });

  describe("_count: true", () => {
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

    const context: RelationContext = {
      relations,
      findManyOnSheet: mockFindMany,
    };

    test("全リレーションをカウントする", () => {
      const parents = [{ id: 1, name: "Alice" }];

      // posts
      mockFindMany.mockReturnValueOnce([
        { id: 101, authorId: 1 },
        { id: 102, authorId: 1 },
      ]);
      // profile
      mockFindMany.mockReturnValueOnce([{ id: 10, userId: 1 }]);

      const result = resolveCount(parents, true, context);

      expect(result[0]._count).toEqual({ posts: 2, profile: 1 });
    });
  });

  describe("複数リレーション同時カウント", () => {
    const relations: { [name: string]: RelationDefinition } = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      },
      comments: {
        type: "oneToMany",
        to: "Comments",
        field: "id",
        reference: "userId",
      },
    };

    const context: RelationContext = {
      relations,
      findManyOnSheet: mockFindMany,
    };

    test("複数リレーションを同時にカウントする", () => {
      const parents = [{ id: 1, name: "Alice" }];

      // posts
      mockFindMany.mockReturnValueOnce([
        { id: 101, authorId: 1 },
        { id: 102, authorId: 1 },
      ]);
      // comments
      mockFindMany.mockReturnValueOnce([
        { id: 201, userId: 1 },
        { id: 202, userId: 1 },
        { id: 203, userId: 1 },
      ]);

      const result = resolveCount(
        parents,
        { select: { posts: true, comments: true } },
        context,
      );

      expect(result[0]._count).toEqual({ posts: 2, comments: 3 });
    });
  });

  test("空の親配列で空配列を返す", () => {
    const context: RelationContext = {
      relations: {},
      findManyOnSheet: mockFindMany,
    };

    const result = resolveCount([], { select: {} }, context);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
