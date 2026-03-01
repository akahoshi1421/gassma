import { resolveManyToOne } from "../../../../util/relation/resolvers/manyToOne";
import type { RelationDefinition } from "../../../../types/relationTypes";

describe("resolveManyToOne", () => {
  const relation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("親レコードのFK値から対応する参照先を単一オブジェクトで付与する", () => {
    const parents = [
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 2, title: "Post B" },
      { id: 103, authorId: 1, title: "Post C" },
    ];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany);

    expect(result[0]).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
      author: { id: 1, name: "Alice" },
    });
    expect(result[1]).toEqual({
      id: 102,
      authorId: 2,
      title: "Post B",
      author: { id: 2, name: "Bob" },
    });
    expect(result[2]).toEqual({
      id: 103,
      authorId: 1,
      title: "Post C",
      author: { id: 1, name: "Alice" },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: { in: [1, 2, 1] } },
    });
  });

  it("FK値がnullの場合はnullを付与する", () => {
    const parents = [{ id: 101, authorId: null, title: "Draft" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany);

    expect(result[0]).toEqual({
      id: 101,
      authorId: null,
      title: "Draft",
      author: null,
    });
  });

  it("対応する参照先がない場合はnullを付与する", () => {
    const parents = [{ id: 101, authorId: 999, title: "Orphan" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany);

    expect(result[0]).toEqual({
      id: 101,
      authorId: 999,
      title: "Orphan",
      author: null,
    });
  });

  it("includeオプションのwhereをAND結合して渡す", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice", active: true }]);

    resolveManyToOne(parents, relation, "author", mockFindMany, {
      where: { active: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: {
        AND: [{ id: { in: [1] } }, { active: true }],
      },
    });
  });

  it("親レコードが空配列の場合はfindManyを呼ばず空配列を返す", () => {
    const result = resolveManyToOne([], relation, "author", mockFindMany);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("includeオプション付きでfindManyOnSheetにincludeが渡される", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

    resolveManyToOne(parents, relation, "author", mockFindMany, {
      include: { profile: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: { in: [1] } },
      include: { profile: true },
    });
  });

  it("reference側に重複がある場合はエラーを投げる", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice" },
      { id: 1, name: "Alice Duplicate" },
    ]);

    expect(() =>
      resolveManyToOne(parents, relation, "author", mockFindMany),
    ).toThrow('Duplicate value "1" found in "Users.id" for a unique relation');
  });
});
