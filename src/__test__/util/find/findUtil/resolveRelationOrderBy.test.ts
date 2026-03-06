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

  test("should throw for oneToMany relation", () => {
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
});
