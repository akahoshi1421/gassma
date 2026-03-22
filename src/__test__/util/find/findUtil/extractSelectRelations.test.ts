import { extractSelectRelations } from "../../../../util/find/findUtil/extractSelectRelations";

describe("extractSelectRelations", () => {
  it("should return null relationInclude when no relation keys exist", () => {
    const result = extractSelectRelations({ id: true, name: true }, [
      "posts",
      "profile",
    ]);

    expect(result.scalarSelect).toEqual({ id: true, name: true });
    expect(result.relationInclude).toBeNull();
  });

  it("should extract relation key with true value", () => {
    const result = extractSelectRelations({ id: true, posts: true }, ["posts"]);

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.relationInclude).toEqual({ posts: true });
  });

  it("should extract relation key with options object", () => {
    const options = { where: { published: true }, take: 5 };
    const result = extractSelectRelations({ id: true, posts: options }, [
      "posts",
    ]);

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.relationInclude).toEqual({ posts: options });
  });

  it("should extract multiple relation keys", () => {
    const result = extractSelectRelations(
      { id: true, posts: true, profile: { where: { active: true } } },
      ["posts", "profile"],
    );

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.relationInclude).toEqual({
      posts: true,
      profile: { where: { active: true } },
    });
  });

  it("should return null scalarSelect when only relations selected", () => {
    const result = extractSelectRelations({ posts: true }, ["posts"]);

    expect(result.scalarSelect).toBeNull();
    expect(result.relationInclude).toEqual({ posts: true });
  });

  it("should exclude _count from both scalar and relation", () => {
    const result = extractSelectRelations(
      { id: true, _count: true, posts: true },
      ["posts"],
    );

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.relationInclude).toEqual({ posts: true });
  });

  it("should return null relationInclude when relation names list is empty", () => {
    const result = extractSelectRelations({ id: true, name: true }, []);

    expect(result.scalarSelect).toEqual({ id: true, name: true });
    expect(result.relationInclude).toBeNull();
  });

  it("should treat unknown keys as scalar fields", () => {
    const result = extractSelectRelations({ id: true, unknownField: true }, [
      "posts",
    ]);

    expect(result.scalarSelect).toEqual({ id: true, unknownField: true });
    expect(result.relationInclude).toBeNull();
  });
});
