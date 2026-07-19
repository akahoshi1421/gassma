import { resolveWhereRelation } from "../../../../util/relation/whereRelation/resolveWhereRelation";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";

describe("where 直値 null ショートハンド（resolveWhereRelation 単体）", () => {
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

  it("manyToOne の直値 null は is: null と同義（FK が null）", () => {
    const where: WhereUse = { author: null };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ AND: [{ authorId: null }] });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("oneToOne(非FK側)の直値 null は is: null と同義（reference 値の notIn）", () => {
    const where: WhereUse = { profile: null };

    mockFindMany.mockReturnValue([
      { id: 301, userId: 1 },
      { id: 302, userId: 2 },
    ]);

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ AND: [{ id: { notIn: [1, 2] } }] });
    expect(mockFindMany).toHaveBeenCalledWith("Profiles", { where: {} });
  });

  it("通常条件と直値 null を組み合わせられる", () => {
    const where: WhereUse = { name: "Alice", author: null };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ AND: [{ name: "Alice" }, { authorId: null }] });
  });

  it("oneToMany への直値 null はエラーを投げる", () => {
    const where: WhereUse = { posts: null };

    expect(() => resolveWhereRelation(where, context)).toThrow(
      'Filter "null" cannot be used on relation "posts" of type "oneToMany"',
    );
  });

  it("manyToMany への直値 null はエラーを投げる", () => {
    const where: WhereUse = { tags: null };

    expect(() => resolveWhereRelation(where, context)).toThrow(
      'Filter "null" cannot be used on relation "tags" of type "manyToMany"',
    );
  });

  it("AND 内の直値 null を解決する", () => {
    const where: WhereUse = { AND: [{ author: null }] };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ AND: [{ AND: [{ authorId: null }] }] });
  });

  it("OR 内の直値 null を解決する", () => {
    const where: WhereUse = { OR: [{ author: null }, { name: "Alice" }] };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({
      OR: [{ AND: [{ authorId: null }] }, { name: "Alice" }],
    });
  });

  it("NOT 内の直値 null を解決する", () => {
    const where: WhereUse = { NOT: { author: null } };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ NOT: { AND: [{ authorId: null }] } });
  });

  it("AND 内の list リレーション直値 null もエラーを投げる", () => {
    const where: WhereUse = { AND: [{ posts: null }] };

    expect(() => resolveWhereRelation(where, context)).toThrow(
      'Filter "null" cannot be used on relation "posts" of type "oneToMany"',
    );
  });

  it("リレーション名でないキーの null は通常条件のまま扱う", () => {
    const where: WhereUse = { deletedAt: null };

    const result = resolveWhereRelation(where, context);

    expect(result).toEqual({ deletedAt: null });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("relationContext が null の場合は直値 null を素通しする", () => {
    const where: WhereUse = { profile: null };

    const result = resolveWhereRelation(where, null);

    expect(result).toEqual({ profile: null });
  });
});
