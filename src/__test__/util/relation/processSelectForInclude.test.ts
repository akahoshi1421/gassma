import { processSelectForInclude } from "../../../util/relation/processSelectForInclude";

describe("processSelectForInclude", () => {
  it("should return null nestedInclude when all values are true", () => {
    const result = processSelectForInclude({ id: true, name: true });

    expect(result.scalarSelect).toEqual({ id: true, name: true });
    expect(result.nestedInclude).toBeNull();
  });

  it("should extract object values as nested include", () => {
    const result = processSelectForInclude({
      id: true,
      comments: { select: { id: true, text: true } },
    });

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.nestedInclude).toEqual({
      comments: { select: { id: true, text: true } },
    });
  });

  it("should return null scalarSelect when only nested includes", () => {
    const result = processSelectForInclude({
      comments: { where: { active: true } },
    });

    expect(result.scalarSelect).toBeNull();
    expect(result.nestedInclude).toEqual({
      comments: { where: { active: true } },
    });
  });

  it("should exclude _count from both scalar and nested", () => {
    const result = processSelectForInclude({
      id: true,
      _count: true,
      comments: { select: { id: true } },
    });

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.nestedInclude).toEqual({
      comments: { select: { id: true } },
    });
  });

  it("should handle multiple nested includes", () => {
    const result = processSelectForInclude({
      id: true,
      posts: { where: { published: true } },
      profile: { select: { bio: true } },
    });

    expect(result.scalarSelect).toEqual({ id: true });
    expect(result.nestedInclude).toEqual({
      posts: { where: { published: true } },
      profile: { select: { bio: true } },
    });
  });
});
