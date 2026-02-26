import { applyNoneFilter } from "../../../../../util/relation/whereRelation/filters/noneFilter";
import type { RelationDefinition } from "../../../../../types/relationTypes";
import type { WhereUse } from "../../../../../types/coreTypes";

describe("applyNoneFilter", () => {
  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  describe("oneToMany", () => {
    const relation: RelationDefinition = {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    };

    it("条件に合致する子レコードを持つ親のキーでnotInフィルタを生成する", () => {
      const filterWhere: WhereUse = { published: true };

      mockFindMany.mockReturnValue([
        { id: 1, authorId: 1, published: true },
        { id: 2, authorId: 3, published: true },
      ]);

      const result = applyNoneFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { notIn: [1, 3] } });
    });

    it("条件に合致する子レコードがない場合はnotIn: []を返す", () => {
      const filterWhere: WhereUse = { published: true };
      mockFindMany.mockReturnValue([]);

      const result = applyNoneFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { notIn: [] } });
    });
  });

  describe("manyToMany", () => {
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

    it("中間テーブル経由で条件合致のparentKeyでnotInフィルタを生成する", () => {
      const filterWhere: WhereUse = { name: "TypeScript" };

      mockFindMany.mockImplementation((sheet: string) => {
        if (sheet === "Tags") return [{ id: 10, name: "TypeScript" }];
        if (sheet === "PostTags") {
          return [
            { postId: 1, tagId: 10 },
            { postId: 3, tagId: 10 },
          ];
        }
        return [];
      });

      const result = applyNoneFilter(
        relation,
        "tags",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { notIn: [1, 3] } });
    });
  });
});
