import { resolveWhereRelation } from "../../../../util/relation/whereRelation/resolveWhereRelation";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
// エラーメッセージベースで検証（TypeScript target ES5の場合instanceofが使えないため）

describe("resolveWhereRelation", () => {
  const mockFindMany = jest.fn();

  const relations: { [relationName: string]: RelationDefinition } = {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
    author: {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
    },
    profile: {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    },
    tags: {
      type: "manyToMany",
      to: "Tags",
      field: "id",
      reference: "id",
      through: {
        sheet: "PostTags",
        field: "postId",
        reference: "tagId",
      },
    },
  };

  const context: RelationContext = {
    relations,
    findManyOnSheet: mockFindMany,
  };

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("リレーションフィルタがない場合はwhereをそのまま返す", () => {
    const where: WhereUse = { name: "Alice", age: 30 };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ name: "Alice", age: 30 });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("someフィルタを含むwhereを変換する", () => {
    const where: WhereUse = {
      name: "Alice",
      posts: { some: { published: true } },
    };

    mockFindMany.mockReturnValue([{ id: 1, authorId: 1, published: true }]);

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ name: "Alice" }, { id: { in: [1] } }],
    });
  });

  it("noneフィルタを含むwhereを変換する", () => {
    const where: WhereUse = {
      posts: { none: { published: false } },
    };

    mockFindMany.mockReturnValue([{ id: 1, authorId: 2, published: false }]);

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ id: { notIn: [2] } }],
    });
  });

  it("isフィルタを含むwhereを変換する", () => {
    const where: WhereUse = {
      author: { is: { name: "Alice" } },
    };

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ authorId: { in: [1] } }],
    });
  });

  it("is: null フィルタを変換する", () => {
    const where: WhereUse = {
      author: { is: null },
    };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ authorId: null }],
    });
  });

  it("isNotフィルタを含むwhereを変換する", () => {
    const where: WhereUse = {
      author: { isNot: { name: "Alice" } },
    };

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ authorId: { notIn: [1] } }],
    });
  });

  it("isNot: null フィルタを変換する", () => {
    const where: WhereUse = {
      author: { isNot: null },
    };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ authorId: { not: null } }],
    });
  });

  it("everyフィルタを含むwhereを変換する", () => {
    const where: WhereUse = {
      posts: { every: { published: true } },
    };

    mockFindMany.mockImplementation(
      (_sheet: string, findData: { where?: WhereUse }) => {
        if (!findData.where || Object.keys(findData.where).length === 0) {
          return [
            { id: 1, authorId: 1, published: true },
            { id: 2, authorId: 2, published: false },
          ];
        }
        return [{ id: 1, authorId: 1, published: true }];
      },
    );

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ id: { notIn: [2] } }],
    });
  });

  it("複数のリレーションフィルタと通常条件を組み合わせる", () => {
    const where: WhereUse = {
      name: "Alice",
      posts: { some: { published: true } },
      profile: { is: { bio: "developer" } },
    };

    mockFindMany.mockImplementation((sheet: string) => {
      if (sheet === "Posts") {
        return [{ id: 1, authorId: 1, published: true }];
      }
      if (sheet === "Profiles") {
        return [{ id: 1, userId: 1, bio: "developer" }];
      }
      return [];
    });

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      AND: [{ name: "Alice" }, { id: { in: [1] } }, { id: { in: [1] } }],
    });
  });

  it("oneToOneリレーションにsome/every/noneを使用するとエラーを投げる", () => {
    const where: WhereUse = {
      profile: { some: { bio: "test" } },
    };

    expect(() => resolveWhereRelation(where, context)).toThrow(
      'Filter "some" cannot be used on relation "profile" of type "oneToOne"',
    );
  });

  it("oneToManyリレーションにis/isNotを使用するとエラーを投げる", () => {
    const where: WhereUse = {
      posts: { is: { published: true } },
    };

    expect(() => resolveWhereRelation(where, context)).toThrow(
      'Filter "is" cannot be used on relation "posts" of type "oneToMany"',
    );
  });

  it("relationContextがnullの場合でリレーションフィルタがあるとエラーを投げる", () => {
    const where: WhereUse = {
      posts: { some: { published: true } },
    };

    expect(() => resolveWhereRelation(where, null)).toThrow(
      "Cannot use relation filters in where clause without defining relations",
    );
  });

  it("relationContextがnullでもリレーションフィルタがなければそのまま返す", () => {
    const where: WhereUse = { name: "Alice" };

    const result = resolveWhereRelation(where, null);

    expect(result).toEqual({ name: "Alice" });
  });

  describe("AND/OR/NOT 再帰対応", () => {
    it("OR内のリレーションフィルタを再帰的に解決する", () => {
      const where: WhereUse = {
        OR: [{ posts: { some: { published: true } } }, { name: "Alice" }],
      };

      mockFindMany.mockReturnValue([{ id: 1, authorId: 1, published: true }]);

      const result = resolveWhereRelation(where, context);

      expect(result).toEqual({
        OR: [{ AND: [{ id: { in: [1] } }] }, { name: "Alice" }],
      });
    });

    it("AND内のリレーションフィルタを再帰的に解決する", () => {
      const where: WhereUse = {
        AND: [{ posts: { some: { published: true } } }, { name: "Alice" }],
      };

      mockFindMany.mockReturnValue([{ id: 1, authorId: 1, published: true }]);

      const result = resolveWhereRelation(where, context);

      expect(result).toEqual({
        AND: [{ AND: [{ id: { in: [1] } }] }, { name: "Alice" }],
      });
    });

    it("NOT内のリレーションフィルタを再帰的に解決する", () => {
      const where: WhereUse = {
        NOT: { posts: { some: { published: true } } },
      };

      mockFindMany.mockReturnValue([{ id: 1, authorId: 1, published: true }]);

      const result = resolveWhereRelation(where, context);

      expect(result).toEqual({
        NOT: { AND: [{ id: { in: [1] } }] },
      });
    });

    it("深くネストされたAND/OR/NOT内のリレーションフィルタを解決する", () => {
      const where: WhereUse = {
        OR: [
          {
            AND: [{ NOT: { posts: { some: { published: true } } } }],
          },
        ],
      };

      mockFindMany.mockReturnValue([{ id: 1, authorId: 1, published: true }]);

      const result = resolveWhereRelation(where, context);

      expect(result).toEqual({
        OR: [
          {
            AND: [{ NOT: { AND: [{ id: { in: [1] } }] } }],
          },
        ],
      });
    });

    it("トップレベルとAND/OR内の両方のリレーションフィルタを解決する", () => {
      const where: WhereUse = {
        posts: { some: { published: true } },
        OR: [{ profile: { is: { bio: "developer" } } }, { name: "Alice" }],
      };

      mockFindMany.mockImplementation((sheet: string) => {
        if (sheet === "Posts") {
          return [{ id: 1, authorId: 1, published: true }];
        }
        if (sheet === "Profiles") {
          return [{ id: 1, userId: 1, bio: "developer" }];
        }
        return [];
      });

      const result = resolveWhereRelation(where, context);

      expect(result).toEqual({
        AND: [
          {
            OR: [{ AND: [{ id: { in: [1] } }] }, { name: "Alice" }],
          },
          { id: { in: [1] } },
        ],
      });
    });
  });
});
