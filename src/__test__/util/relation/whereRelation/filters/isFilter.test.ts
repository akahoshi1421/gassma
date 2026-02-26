import { applyIsFilter } from "../../../../../util/relation/whereRelation/filters/isFilter";
import type { RelationDefinition } from "../../../../../types/relationTypes";
import type { WhereUse } from "../../../../../types/coreTypes";

describe("applyIsFilter", () => {
  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  describe("manyToOne", () => {
    const relation: RelationDefinition = {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
    };

    it("条件に合致するターゲットのキーでinフィルタを生成する", () => {
      const filterWhere: WhereUse = { name: "Alice" };

      mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

      const result = applyIsFilter(
        relation,
        "author",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ authorId: { in: [1] } });
      expect(mockFindMany).toHaveBeenCalledWith("Users", {
        where: { name: "Alice" },
      });
    });

    it("条件に合致するターゲットがない場合はin: []を返す", () => {
      const filterWhere: WhereUse = { name: "Unknown" };
      mockFindMany.mockReturnValue([]);

      const result = applyIsFilter(
        relation,
        "author",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ authorId: { in: [] } });
    });
  });

  describe("oneToOne", () => {
    const relation: RelationDefinition = {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    };

    it("条件に合致するターゲットのreferenceキーでinフィルタを生成する", () => {
      const filterWhere: WhereUse = { bio: "developer" };

      mockFindMany.mockReturnValue([{ id: 1, userId: 10, bio: "developer" }]);

      const result = applyIsFilter(
        relation,
        "profile",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { in: [10] } });
    });
  });

  describe("is: null", () => {
    const relation: RelationDefinition = {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
    };

    it("nullが渡された場合はフィールドがnullの条件を返す", () => {
      const result = applyIsFilter(relation, "author", null, mockFindMany);

      expect(result).toEqual({ authorId: null });
      expect(mockFindMany).not.toHaveBeenCalled();
    });
  });
});
