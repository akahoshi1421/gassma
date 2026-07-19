import { applyIsNotFilter } from "../../../../../util/relation/whereRelation/filters/isNotFilter";
import type { RelationDefinition } from "../../../../../types/relationTypes";
import type { WhereUse } from "../../../../../types/coreTypes";

describe("applyIsNotFilter", () => {
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

    it("条件に合致するターゲットのキーでnotInフィルタを生成する", () => {
      const filterWhere: WhereUse = { name: "Alice" };

      mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

      const result = applyIsNotFilter(
        relation,
        "author",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ authorId: { notIn: [1] } });
    });

    it("条件に合致するターゲットがない場合はnotIn: []を返す", () => {
      const filterWhere: WhereUse = { name: "Unknown" };
      mockFindMany.mockReturnValue([]);

      const result = applyIsNotFilter(
        relation,
        "author",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ authorId: { notIn: [] } });
    });
  });

  describe("oneToOne", () => {
    const relation: RelationDefinition = {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    };

    it("条件に合致するターゲットのreferenceキーでnotInフィルタを生成する", () => {
      const filterWhere: WhereUse = { bio: "developer" };

      mockFindMany.mockReturnValue([{ id: 1, userId: 10, bio: "developer" }]);

      const result = applyIsNotFilter(
        relation,
        "profile",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { notIn: [10] } });
    });
  });

  describe("isNot: null (manyToOne)", () => {
    const relation: RelationDefinition = {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
    };

    it("nullが渡された場合はフィールドがnot nullの条件を返す", () => {
      const result = applyIsNotFilter(relation, "author", null, mockFindMany);

      expect(result).toEqual({ authorId: { not: null } });
      expect(mockFindMany).not.toHaveBeenCalled();
    });
  });

  describe("isNot: null (oneToOne 非FK側)", () => {
    const relation: RelationDefinition = {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    };

    it("相手シートのreference値に含まれるフィールドのin条件を返す", () => {
      mockFindMany.mockReturnValue([
        { id: 301, userId: 1 },
        { id: 302, userId: 2 },
      ]);

      const result = applyIsNotFilter(relation, "profile", null, mockFindMany);

      expect(result).toEqual({ id: { in: [1, 2] } });
      expect(mockFindMany).toHaveBeenCalledWith("Profiles", { where: {} });
    });

    it("reference値がnullの行はキー収集から除外される", () => {
      mockFindMany.mockReturnValue([
        { id: 301, userId: 1 },
        { id: 303, userId: null },
      ]);

      const result = applyIsNotFilter(relation, "profile", null, mockFindMany);

      expect(result).toEqual({ id: { in: [1] } });
    });

    it("相手シートが空の場合はin: []を返す", () => {
      mockFindMany.mockReturnValue([]);

      const result = applyIsNotFilter(relation, "profile", null, mockFindMany);

      expect(result).toEqual({ id: { in: [] } });
    });
  });
});
