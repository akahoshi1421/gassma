import { applySomeFilter } from "../../../../../util/relation/whereRelation/filters/someFilter";
import type { RelationDefinition } from "../../../../../types/relationTypes";
import type { WhereUse } from "../../../../../types/coreTypes";

describe("applySomeFilter", () => {
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

    it("条件に合致する子レコードを持つ親のキーでinフィルタを生成する", () => {
      const filterWhere: WhereUse = { published: true };

      mockFindMany.mockReturnValue([
        { id: 1, authorId: 1, published: true },
        { id: 2, authorId: 3, published: true },
      ]);

      const result = applySomeFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { in: [1, 3] } });
      expect(mockFindMany).toHaveBeenCalledWith("Posts", {
        where: { published: true },
      });
    });

    it("条件に合致する子レコードがない場合はin: []を返す", () => {
      const filterWhere: WhereUse = { published: true };
      mockFindMany.mockReturnValue([]);

      const result = applySomeFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { in: [] } });
    });

    it("空のwhereの場合は全子レコードからキーを収集する", () => {
      const filterWhere: WhereUse = {};

      mockFindMany.mockReturnValue([
        { id: 1, authorId: 2 },
        { id: 2, authorId: 2 },
        { id: 3, authorId: 5 },
      ]);

      const result = applySomeFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { in: [2, 2, 5] } });
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

    it("中間テーブル経由で条件合致のparentKeyでinフィルタを生成する", () => {
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

      const result = applySomeFilter(
        relation,
        "tags",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { in: [1, 3] } });
    });
  });
});
