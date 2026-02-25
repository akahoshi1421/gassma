import { resolveOneToMany } from "../../../../util/relation/resolvers/oneToMany";
import type { RelationDefinition } from "../../../../types/relationTypes";

describe("resolveOneToMany", () => {
  const relation: RelationDefinition = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("親レコードに対応する子レコードを配列で付与する", () => {
    const parents = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    mockFindMany.mockReturnValue([
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 1, title: "Post B" },
      { id: 103, authorId: 2, title: "Post C" },
    ]);

    const result = resolveOneToMany(parents, relation, "posts", mockFindMany);

    expect(result[0]).toEqual({
      id: 1,
      name: "Alice",
      posts: [
        { id: 101, authorId: 1, title: "Post A" },
        { id: 102, authorId: 1, title: "Post B" },
      ],
    });
    expect(result[1]).toEqual({
      id: 2,
      name: "Bob",
      posts: [{ id: 103, authorId: 2, title: "Post C" }],
    });

    expect(mockFindMany).toHaveBeenCalledWith("Posts", {
      where: { authorId: { in: [1, 2] } },
    });
  });

  it("対応する子レコードが0件の場合は空配列を付与する", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveOneToMany(parents, relation, "posts", mockFindMany);

    expect(result[0]).toEqual({
      id: 1,
      name: "Alice",
      posts: [],
    });
  });

  it("includeオプションのwhereをAND結合して渡す", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([
      { id: 101, authorId: 1, title: "Post A", published: true },
    ]);

    const result = resolveOneToMany(parents, relation, "posts", mockFindMany, {
      where: { published: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Posts", {
      where: {
        AND: [{ authorId: { in: [1] } }, { published: true }],
      },
    });

    expect(result[0].posts).toEqual([
      { id: 101, authorId: 1, title: "Post A", published: true },
    ]);
  });

  it("includeオプションのorderByを親ごとのグループに適用する", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([
      { id: 102, authorId: 1, title: "B", createdAt: 2 },
      { id: 101, authorId: 1, title: "A", createdAt: 1 },
    ]);

    const result = resolveOneToMany(parents, relation, "posts", mockFindMany, {
      orderBy: { createdAt: "desc" },
    });

    expect(result[0].posts[0].createdAt).toBe(2);
    expect(result[0].posts[1].createdAt).toBe(1);
  });

  it("includeオプションのtakeを親ごとに適用する", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 1, title: "Post B" },
      { id: 103, authorId: 1, title: "Post C" },
    ]);

    const result = resolveOneToMany(parents, relation, "posts", mockFindMany, {
      take: 2,
    });

    expect(result[0].posts).toHaveLength(2);
  });

  it("親レコードが空配列の場合はfindManyを呼ばず空配列を返す", () => {
    const result = resolveOneToMany([], relation, "posts", mockFindMany);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
