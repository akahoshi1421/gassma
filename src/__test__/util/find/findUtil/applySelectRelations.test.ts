import { applySelectRelations } from "../../../../util/find/findUtil/applySelectRelations";

describe("applySelectRelations", () => {
  it("should pick scalar select fields and relation keys", () => {
    const records = [
      { id: 1, name: "Alice", email: "a@b.c", posts: [{ id: 10 }] },
    ];
    const result = applySelectRelations(records, { id: true }, ["posts"]);

    expect(result).toEqual([{ id: 1, posts: [{ id: 10 }] }]);
  });

  it("should pick only relation keys when scalarSelect is null", () => {
    const records = [{ id: 1, name: "Alice", posts: [{ id: 10 }] }];
    const result = applySelectRelations(records, null, ["posts"]);

    expect(result).toEqual([{ posts: [{ id: 10 }] }]);
  });

  it("should include _count when countValue is provided", () => {
    const records = [
      { id: 1, name: "Alice", posts: [{ id: 10 }], _count: { posts: 1 } },
    ];
    const result = applySelectRelations(records, { id: true }, ["posts"], true);

    expect(result).toEqual([
      { id: 1, posts: [{ id: 10 }], _count: { posts: 1 } },
    ]);
  });

  it("should not include _count when countValue is undefined", () => {
    const records = [
      { id: 1, name: "Alice", posts: [{ id: 10 }], _count: { posts: 1 } },
    ];
    const result = applySelectRelations(records, { id: true }, ["posts"]);

    expect(result).toEqual([{ id: 1, posts: [{ id: 10 }] }]);
  });

  it("should handle multiple relation keys", () => {
    const records = [
      {
        id: 1,
        name: "Alice",
        posts: [{ id: 10 }],
        profile: { bio: "hello" },
      },
    ];
    const result = applySelectRelations(records, { id: true }, [
      "posts",
      "profile",
    ]);

    expect(result).toEqual([
      { id: 1, posts: [{ id: 10 }], profile: { bio: "hello" } },
    ]);
  });

  it("should handle multiple records", () => {
    const records = [
      { id: 1, name: "Alice", posts: [{ id: 10 }] },
      { id: 2, name: "Bob", posts: [{ id: 20 }] },
    ];
    const result = applySelectRelations(records, { id: true }, ["posts"]);

    expect(result).toEqual([
      { id: 1, posts: [{ id: 10 }] },
      { id: 2, posts: [{ id: 20 }] },
    ]);
  });

  it("should handle empty records", () => {
    const result = applySelectRelations([], { id: true }, ["posts"]);

    expect(result).toEqual([]);
  });

  it("should handle only _count without scalar or relation keys", () => {
    const records = [{ id: 1, name: "Alice", _count: { posts: 3 } }];
    const result = applySelectRelations(records, null, [], true);

    expect(result).toEqual([{ _count: { posts: 3 } }]);
  });
});
