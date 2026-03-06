import { resolveRelationOrderBy } from "../../../../util/find/findUtil/resolveRelationOrderBy";
import type { RelationContext } from "../../../../types/relationTypes";
import type { OrderBy } from "../../../../types/coreTypes";

const createRelationContext = (
  findManyOnSheet: RelationContext["findManyOnSheet"],
): RelationContext => ({
  relations: {
    author: {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
    },
    profile: {
      type: "oneToOne",
      to: "Profiles",
      field: "profileId",
      reference: "id",
    },
    posts: {
      type: "oneToMany",
      to: "Posts",
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
  },
  findManyOnSheet,
});

describe("resolveRelationOrderBy", () => {
  test("should sort by manyToOne relation field asc", () => {
    const records = [
      { id: 1, title: "Post A", authorId: 2 },
      { id: 2, title: "Post B", authorId: 1 },
      { id: 3, title: "Post C", authorId: 3 },
    ];

    const findManyOnSheet = jest.fn(
      (sheetName: string, _findData: { where?: unknown }) => {
        if (sheetName === "Users") {
          return [
            { id: 1, name: "Charlie" },
            { id: 2, name: "Alice" },
            { id: 3, name: "Bob" },
          ];
        }
        return [];
      },
    );

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ author: { name: "asc" } }];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // Alice(authorId=2) < Bob(authorId=3) < Charlie(authorId=1)
    expect(result).toEqual([
      { id: 1, title: "Post A", authorId: 2 },
      { id: 3, title: "Post C", authorId: 3 },
      { id: 2, title: "Post B", authorId: 1 },
    ]);
    // temp keys should be removed
    result.forEach((r) => {
      Object.keys(r).forEach((key) => {
        expect(key).not.toContain("__gassma_rel__");
      });
    });
  });

  test("should sort by manyToOne relation field desc", () => {
    const records = [
      { id: 1, title: "Post A", authorId: 2 },
      { id: 2, title: "Post B", authorId: 1 },
      { id: 3, title: "Post C", authorId: 3 },
    ];

    const findManyOnSheet = jest.fn(() => [
      { id: 1, name: "Charlie" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Bob" },
    ]);

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ author: { name: "desc" } }];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // Charlie(authorId=1) > Bob(authorId=3) > Alice(authorId=2)
    expect(result).toEqual([
      { id: 2, title: "Post B", authorId: 1 },
      { id: 3, title: "Post C", authorId: 3 },
      { id: 1, title: "Post A", authorId: 2 },
    ]);
  });

  test("should handle null FK (asc: null first, desc: null last)", () => {
    const records = [
      { id: 1, title: "Post A", authorId: 2 },
      { id: 2, title: "Post B", authorId: null },
      { id: 3, title: "Post C", authorId: 1 },
    ];

    const findManyOnSheet = jest.fn(() => [
      { id: 1, name: "Bob" },
      { id: 2, name: "Alice" },
    ]);

    const context = createRelationContext(findManyOnSheet);

    // asc: null goes first
    const resultAsc = resolveRelationOrderBy(
      [...records],
      [{ author: { name: "asc" } }] satisfies OrderBy[],
      context,
    );
    expect(resultAsc[0].id).toBe(2); // null FK first

    // desc: null goes last
    const resultDesc = resolveRelationOrderBy(
      [...records],
      [{ author: { name: "desc" } }] satisfies OrderBy[],
      context,
    );
    expect(resultDesc[resultDesc.length - 1].id).toBe(2); // null FK last
  });

  test("should handle mixed scalar and relation orderBy", () => {
    const records = [
      { id: 1, title: "B Post", authorId: 1 },
      { id: 2, title: "A Post", authorId: 1 },
      { id: 3, title: "C Post", authorId: 2 },
    ];

    const findManyOnSheet = jest.fn(() => [
      { id: 1, name: "Alice" },
      { id: 2, name: "Alice" },
    ]);

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [
      { author: { name: "asc" } },
      { title: "asc" },
    ];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // Both authors are "Alice", so secondary sort by title asc
    expect(result).toEqual([
      { id: 2, title: "A Post", authorId: 1 },
      { id: 1, title: "B Post", authorId: 1 },
      { id: 3, title: "C Post", authorId: 2 },
    ]);
  });

  test("should sort by oneToOne relation field", () => {
    const records = [
      { id: 1, name: "User A", profileId: 2 },
      { id: 2, name: "User B", profileId: 1 },
    ];

    const findManyOnSheet = jest.fn((sheetName: string) => {
      if (sheetName === "Profiles") {
        return [
          { id: 1, bio: "Zebra" },
          { id: 2, bio: "Apple" },
        ];
      }
      return [];
    });

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ profile: { bio: "asc" } }];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // Apple(profileId=2) < Zebra(profileId=1)
    expect(result).toEqual([
      { id: 1, name: "User A", profileId: 2 },
      { id: 2, name: "User B", profileId: 1 },
    ]);
  });

  test("should throw for oneToMany relation field sort", () => {
    const findManyOnSheet = jest.fn(() => []);
    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ posts: { title: "asc" } }];

    expect(() =>
      resolveRelationOrderBy([{ id: 1 }], orderByArr, context),
    ).toThrow("Only manyToOne and oneToOne are supported");
  });

  test("should return records as-is when empty", () => {
    const findManyOnSheet = jest.fn(() => []);
    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ author: { name: "asc" } }];

    const result = resolveRelationOrderBy([], orderByArr, context);
    expect(result).toEqual([]);
  });

  test("should sort by oneToMany _count asc", () => {
    const records = [
      { id: 1, name: "User A" },
      { id: 2, name: "User B" },
      { id: 3, name: "User C" },
    ];

    const findManyOnSheet = jest.fn(
      (sheetName: string, _findData: { where?: unknown }) => {
        if (sheetName === "Posts") {
          return [
            { id: 1, userId: 1 },
            { id: 2, userId: 1 },
            { id: 3, userId: 1 },
            { id: 4, userId: 3 },
          ];
        }
        return [];
      },
    );

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ posts: { _count: "asc" } }];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // User B(0) < User C(1) < User A(3)
    expect(result).toEqual([
      { id: 2, name: "User B" },
      { id: 3, name: "User C" },
      { id: 1, name: "User A" },
    ]);
    // temp keys should be removed
    result.forEach((r) => {
      Object.keys(r).forEach((key) => {
        expect(key).not.toContain("__gassma_rel__");
      });
    });
  });

  test("should sort by oneToMany _count desc", () => {
    const records = [
      { id: 1, name: "User A" },
      { id: 2, name: "User B" },
      { id: 3, name: "User C" },
    ];

    const findManyOnSheet = jest.fn(
      (sheetName: string, _findData: { where?: unknown }) => {
        if (sheetName === "Posts") {
          return [
            { id: 1, userId: 1 },
            { id: 2, userId: 1 },
            { id: 3, userId: 1 },
            { id: 4, userId: 3 },
          ];
        }
        return [];
      },
    );

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ posts: { _count: "desc" } }];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // User A(3) > User C(1) > User B(0)
    expect(result).toEqual([
      { id: 1, name: "User A" },
      { id: 3, name: "User C" },
      { id: 2, name: "User B" },
    ]);
  });

  test("should sort by manyToMany _count", () => {
    const records = [
      { id: 1, title: "Post A" },
      { id: 2, title: "Post B" },
      { id: 3, title: "Post C" },
    ];

    const findManyOnSheet = jest.fn(
      (sheetName: string, _findData: { where?: unknown }) => {
        if (sheetName === "PostTags") {
          return [
            { postId: 2, tagId: 10 },
            { postId: 2, tagId: 11 },
            { postId: 2, tagId: 12 },
            { postId: 1, tagId: 10 },
          ];
        }
        return [];
      },
    );

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ tags: { _count: "desc" } }];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // Post B(3) > Post A(1) > Post C(0)
    expect(result).toEqual([
      { id: 2, title: "Post B" },
      { id: 1, title: "Post A" },
      { id: 3, title: "Post C" },
    ]);
  });

  test("should sort by _count combined with scalar orderBy", () => {
    const records = [
      { id: 1, name: "Charlie" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Bob" },
    ];

    const findManyOnSheet = jest.fn(
      (sheetName: string, _findData: { where?: unknown }) => {
        if (sheetName === "Posts") {
          return [
            { id: 1, userId: 1 },
            { id: 2, userId: 3 },
          ];
        }
        return [];
      },
    );

    const context = createRelationContext(findManyOnSheet);
    // Same _count (1 each for id=1,3; 0 for id=2), then sort by name asc
    const orderByArr: OrderBy[] = [
      { posts: { _count: "desc" } },
      { name: "asc" },
    ];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // _count desc: Bob(1), Charlie(1) tied, then Alice(0)
    // Within tied: name asc → Bob < Charlie
    expect(result).toEqual([
      { id: 3, name: "Bob" },
      { id: 1, name: "Charlie" },
      { id: 2, name: "Alice" },
    ]);
  });

  test("should sort by _count combined with field sort", () => {
    const records = [
      { id: 1, name: "User A", authorId: 2 },
      { id: 2, name: "User B", authorId: 1 },
      { id: 3, name: "User C", authorId: 3 },
    ];

    const findManyOnSheet = jest.fn(
      (sheetName: string, _findData: { where?: unknown }) => {
        if (sheetName === "Users") {
          return [
            { id: 1, name: "Zack" },
            { id: 2, name: "Alice" },
            { id: 3, name: "Mia" },
          ];
        }
        if (sheetName === "Posts") {
          return [
            { id: 1, userId: 1 },
            { id: 2, userId: 1 },
            { id: 3, userId: 3 },
          ];
        }
        return [];
      },
    );

    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [
      { author: { name: "asc" } },
      { posts: { _count: "desc" } },
    ];

    const result = resolveRelationOrderBy(records, orderByArr, context);

    // author name asc: Alice(id=1) < Mia(id=3) < Zack(id=2)
    expect(result).toEqual([
      { id: 1, name: "User A", authorId: 2 },
      { id: 3, name: "User C", authorId: 3 },
      { id: 2, name: "User B", authorId: 1 },
    ]);
  });

  test("should throw for manyToOne _count", () => {
    const findManyOnSheet = jest.fn(() => []);
    const context = createRelationContext(findManyOnSheet);
    const orderByArr: OrderBy[] = [{ author: { _count: "asc" } }];

    expect(() =>
      resolveRelationOrderBy([{ id: 1, authorId: 1 }], orderByArr, context),
    ).toThrow("Only oneToMany and manyToMany are supported");
  });
});
