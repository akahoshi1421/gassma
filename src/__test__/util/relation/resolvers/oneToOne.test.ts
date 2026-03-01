import { resolveOneToOne } from "../../../../util/relation/resolvers/oneToOne";
import type { RelationDefinition } from "../../../../types/relationTypes";

describe("resolveOneToOne", () => {
  const relation: RelationDefinition = {
    type: "oneToOne",
    to: "Profiles",
    field: "id",
    reference: "userId",
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("親レコードに対応する子レコードを単一オブジェクトで付与する", () => {
    const parents = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    mockFindMany.mockReturnValue([
      { id: 10, userId: 1, bio: "Hello" },
      { id: 11, userId: 2, bio: "World" },
    ]);

    const result = resolveOneToOne(parents, relation, "profile", mockFindMany);

    expect(result[0]).toEqual({
      id: 1,
      name: "Alice",
      profile: { id: 10, userId: 1, bio: "Hello" },
    });
    expect(result[1]).toEqual({
      id: 2,
      name: "Bob",
      profile: { id: 11, userId: 2, bio: "World" },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Profiles", {
      where: { userId: { in: [1, 2] } },
    });
  });

  it("対応する子レコードがない場合はnullを付与する", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveOneToOne(parents, relation, "profile", mockFindMany);

    expect(result[0]).toEqual({
      id: 1,
      name: "Alice",
      profile: null,
    });
  });

  it("includeオプションのwhereをAND結合して渡す", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([
      { id: 10, userId: 1, bio: "Hello", active: true },
    ]);

    resolveOneToOne(parents, relation, "profile", mockFindMany, {
      where: { active: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Profiles", {
      where: {
        AND: [{ userId: { in: [1] } }, { active: true }],
      },
    });
  });

  it("親レコードが空配列の場合はfindManyを呼ばず空配列を返す", () => {
    const result = resolveOneToOne([], relation, "profile", mockFindMany);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("includeオプション付きでfindManyOnSheetにincludeが渡される", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([{ id: 10, userId: 1, bio: "Hello" }]);

    resolveOneToOne(parents, relation, "profile", mockFindMany, {
      include: { avatar: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Profiles", {
      where: { userId: { in: [1] } },
      include: { avatar: true },
    });
  });

  it("reference側に重複がある場合はエラーを投げる", () => {
    const parents = [{ id: 1, name: "Alice" }];

    mockFindMany.mockReturnValue([
      { id: 10, userId: 1, bio: "Hello" },
      { id: 11, userId: 1, bio: "Duplicate" },
    ]);

    expect(() =>
      resolveOneToOne(parents, relation, "profile", mockFindMany),
    ).toThrow(
      'Duplicate value "1" found in "Profiles.userId" for a unique relation',
    );
  });
});
