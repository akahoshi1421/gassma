import { resolveManyToMany } from "../../../../util/relation/resolvers/manyToMany";
import type { RelationDefinition } from "../../../../types/relationTypes";

describe("resolveManyToMany", () => {
  const relation: RelationDefinition = {
    type: "manyToMany",
    to: "Categories",
    field: "id",
    reference: "id",
    through: {
      sheet: "PostCategories",
      field: "postId",
      reference: "categoryId",
    },
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("中間テーブル経由で関連レコードを配列で付与する", () => {
    const parents = [
      { id: 1, title: "Post A" },
      { id: 2, title: "Post B" },
    ];

    // 1回目: 中間テーブル取得
    mockFindMany.mockReturnValueOnce([
      { postId: 1, categoryId: 10 },
      { postId: 1, categoryId: 20 },
      { postId: 2, categoryId: 10 },
    ]);

    // 2回目: ターゲット取得
    mockFindMany.mockReturnValueOnce([
      { id: 10, name: "Tech" },
      { id: 20, name: "Science" },
    ]);

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
    );

    expect(result[0]).toEqual({
      id: 1,
      title: "Post A",
      categories: [
        { id: 10, name: "Tech" },
        { id: 20, name: "Science" },
      ],
    });
    expect(result[1]).toEqual({
      id: 2,
      title: "Post B",
      categories: [{ id: 10, name: "Tech" }],
    });

    // 中間テーブルクエリ
    expect(mockFindMany).toHaveBeenNthCalledWith(1, "PostCategories", {
      where: { postId: { in: [1, 2] } },
    });

    // ターゲットクエリ
    expect(mockFindMany).toHaveBeenNthCalledWith(2, "Categories", {
      where: { id: { in: [10, 20, 10] } },
    });
  });

  it("対応するレコードが0件の場合は空配列を付与する", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([]); // 中間テーブル: 空

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
    );

    expect(result[0]).toEqual({
      id: 1,
      title: "Post A",
      categories: [],
    });

    // 中間テーブルが空なのでターゲットクエリは呼ばれない
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("includeオプションのwhereをターゲットクエリにAND結合する", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([{ postId: 1, categoryId: 10 }]);
    mockFindMany.mockReturnValueOnce([{ id: 10, name: "Tech", active: true }]);

    resolveManyToMany(parents, relation, "categories", mockFindMany, {
      where: { active: true },
    });

    expect(mockFindMany).toHaveBeenNthCalledWith(2, "Categories", {
      where: {
        AND: [{ id: { in: [10] } }, { active: true }],
      },
    });
  });

  it("includeオプションのtakeを親ごとに適用する", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([
      { postId: 1, categoryId: 10 },
      { postId: 1, categoryId: 20 },
      { postId: 1, categoryId: 30 },
    ]);
    mockFindMany.mockReturnValueOnce([
      { id: 10, name: "Tech" },
      { id: 20, name: "Science" },
      { id: 30, name: "Art" },
    ]);

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
      { take: 2 },
    );

    expect(result[0].categories).toHaveLength(2);
  });

  it("includeオプションのskipを親ごとに適用する", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([
      { postId: 1, categoryId: 10 },
      { postId: 1, categoryId: 20 },
      { postId: 1, categoryId: 30 },
    ]);
    mockFindMany.mockReturnValueOnce([
      { id: 10, name: "Tech" },
      { id: 20, name: "Science" },
      { id: 30, name: "Art" },
    ]);

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
      { skip: 1 },
    );

    expect(result[0].categories).toHaveLength(2);
  });

  it("skip + take を組み合わせて適用する", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([
      { postId: 1, categoryId: 10 },
      { postId: 1, categoryId: 20 },
      { postId: 1, categoryId: 30 },
    ]);
    mockFindMany.mockReturnValueOnce([
      { id: 10, name: "Tech" },
      { id: 20, name: "Science" },
      { id: 30, name: "Art" },
    ]);

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
      { skip: 1, take: 1 },
    );

    expect(result[0].categories).toHaveLength(1);
  });

  it("take負数で末尾からレコードを取得する", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([
      { postId: 1, categoryId: 10 },
      { postId: 1, categoryId: 20 },
      { postId: 1, categoryId: 30 },
    ]);
    mockFindMany.mockReturnValueOnce([
      { id: 10, name: "Tech" },
      { id: 20, name: "Science" },
      { id: 30, name: "Art" },
    ]);

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
      { take: -1 },
    );

    expect(result[0].categories).toHaveLength(1);
    expect(result[0].categories).toEqual([{ id: 30, name: "Art" }]);
  });

  it("skip負数でエラーを投げる", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([{ postId: 1, categoryId: 10 }]);
    mockFindMany.mockReturnValueOnce([{ id: 10, name: "Tech" }]);

    expect(() =>
      resolveManyToMany(parents, relation, "categories", mockFindMany, {
        skip: -1,
      }),
    ).toThrow(
      "Invalid value for skip argument: Value can only be positive, found: -1",
    );
  });

  it("skipが結果数を超える場合は空配列を返す", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([{ postId: 1, categoryId: 10 }]);
    mockFindMany.mockReturnValueOnce([{ id: 10, name: "Tech" }]);

    const result = resolveManyToMany(
      parents,
      relation,
      "categories",
      mockFindMany,
      { skip: 5 },
    );

    expect(result[0].categories).toEqual([]);
  });

  it("throughが未定義の場合はエラーを投げる", () => {
    const noThroughRelation: RelationDefinition = {
      type: "manyToMany",
      to: "Categories",
      field: "id",
      reference: "id",
    };

    expect(() =>
      resolveManyToMany(
        [{ id: 1 }],
        noThroughRelation,
        "categories",
        mockFindMany,
      ),
    ).toThrow(
      'Relation "categories" is manyToMany but "through" is not defined',
    );
  });

  it("ターゲット取得にincludeが渡され、中間テーブルには渡されない", () => {
    const parents = [{ id: 1, title: "Post A" }];

    mockFindMany.mockReturnValueOnce([{ postId: 1, categoryId: 10 }]);
    mockFindMany.mockReturnValueOnce([{ id: 10, name: "Tech" }]);

    resolveManyToMany(parents, relation, "categories", mockFindMany, {
      include: { subcategories: true },
    });

    // 中間テーブルクエリにはincludeが渡されない
    expect(mockFindMany).toHaveBeenNthCalledWith(1, "PostCategories", {
      where: { postId: { in: [1] } },
    });

    // ターゲットクエリにはincludeが渡される
    expect(mockFindMany).toHaveBeenNthCalledWith(2, "Categories", {
      where: { id: { in: [10] } },
      include: { subcategories: true },
    });
  });

  it("親レコードが空配列の場合はfindManyを呼ばず空配列を返す", () => {
    const result = resolveManyToMany([], relation, "categories", mockFindMany);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
