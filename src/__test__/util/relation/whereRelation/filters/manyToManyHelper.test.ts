import { resolveManyToManyParentKeys } from "../../../../../util/relation/whereRelation/filters/manyToManyHelper";
import type { RelationDefinition } from "../../../../../types/relationTypes";
import type { WhereUse } from "../../../../../types/coreTypes";

describe("resolveManyToManyParentKeys", () => {
  const relation: RelationDefinition = {
    type: "manyToMany",
    to: "Tags",
    field: "id",
    reference: "id",
    through: {
      sheet: "PostTags",
      field: "postId",
      reference: "tagId",
    },
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("条件に合致するターゲット経由で親キーを返す", () => {
    const filterWhere: WhereUse = { name: "TypeScript" };

    // ターゲットシートから条件合致レコード取得
    mockFindMany.mockImplementation(
      (sheet: string, findData: { where?: WhereUse }) => {
        if (sheet === "Tags") {
          return [{ id: 10, name: "TypeScript" }];
        }
        // 中間テーブルから tagId=10 のレコード取得
        if (sheet === "PostTags") {
          return [
            { postId: 1, tagId: 10 },
            { postId: 3, tagId: 10 },
          ];
        }
        return [];
      },
    );

    const result = resolveManyToManyParentKeys(
      relation,
      filterWhere,
      mockFindMany,
    );

    expect(result).toEqual([1, 3]);
    expect(mockFindMany).toHaveBeenCalledWith("Tags", {
      where: { name: "TypeScript" },
    });
  });

  it("条件に合致するターゲットがない場合は空配列を返す", () => {
    const filterWhere: WhereUse = { name: "Unknown" };

    mockFindMany.mockImplementation((sheet: string) => {
      if (sheet === "Tags") return [];
      return [];
    });

    const result = resolveManyToManyParentKeys(
      relation,
      filterWhere,
      mockFindMany,
    );

    expect(result).toEqual([]);
  });

  it("中間テーブルに該当レコードがない場合は空配列を返す", () => {
    const filterWhere: WhereUse = { name: "Rust" };

    mockFindMany.mockImplementation((sheet: string) => {
      if (sheet === "Tags") return [{ id: 99, name: "Rust" }];
      if (sheet === "PostTags") return [];
      return [];
    });

    const result = resolveManyToManyParentKeys(
      relation,
      filterWhere,
      mockFindMany,
    );

    expect(result).toEqual([]);
  });

  it("throughが未定義の場合はエラーを投げる", () => {
    const noThroughRelation: RelationDefinition = {
      type: "manyToMany",
      to: "Tags",
      field: "id",
      reference: "id",
    };

    expect(() =>
      resolveManyToManyParentKeys(noThroughRelation, {}, mockFindMany),
    ).toThrow();
  });
});
