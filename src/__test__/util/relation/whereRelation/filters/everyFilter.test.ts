import { applyEveryFilter } from "../../../../../util/relation/whereRelation/filters/everyFilter";
import type { RelationDefinition } from "../../../../../types/relationTypes";
import type { WhereUse } from "../../../../../types/coreTypes";

describe("applyEveryFilter", () => {
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

    it("全子レコードが条件に合致する親は通過する（notInに含まれない）", () => {
      const filterWhere: WhereUse = { published: true };

      mockFindMany.mockImplementation(
        (_sheet: string, findData: { where?: WhereUse }) => {
          // 全子レコード取得の呼び出し（whereなし）
          if (!findData.where || Object.keys(findData.where).length === 0) {
            return [
              { id: 1, authorId: 1, published: true },
              { id: 2, authorId: 1, published: true },
              { id: 3, authorId: 2, published: false },
            ];
          }
          // 条件合致子レコード（published: true）
          return [
            { id: 1, authorId: 1, published: true },
            { id: 2, authorId: 1, published: true },
          ];
        },
      );

      const result = applyEveryFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      // authorId=2 は全数1, 合致数0 → 失敗
      // authorId=1 は全数2, 合致数2 → 成功（notInに含まれない）
      expect(result).toEqual({ id: { notIn: [2] } });
    });

    it("一部の子レコードが条件に合致しない親はnotInに含まれる", () => {
      const filterWhere: WhereUse = { published: true };

      mockFindMany.mockImplementation(
        (_sheet: string, findData: { where?: WhereUse }) => {
          if (!findData.where || Object.keys(findData.where).length === 0) {
            return [
              { id: 1, authorId: 1, published: true },
              { id: 2, authorId: 1, published: false },
              { id: 3, authorId: 2, published: true },
              { id: 4, authorId: 2, published: false },
            ];
          }
          return [
            { id: 1, authorId: 1, published: true },
            { id: 3, authorId: 2, published: true },
          ];
        },
      );

      const result = applyEveryFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      // authorId=1: 全数2, 合致1 → 失敗
      // authorId=2: 全数2, 合致1 → 失敗
      expect(result).toEqual({ id: { notIn: [1, 2] } });
    });

    it("子レコードが0件の親はvacuous truthで通過する（notInに含まれない）", () => {
      const filterWhere: WhereUse = { published: true };

      // 全子レコードが空
      mockFindMany.mockReturnValue([]);

      const result = applyEveryFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      // 誰も失敗しない
      expect(result).toEqual({ id: { notIn: [] } });
    });

    it("全子レコードが条件に合致しない場合は全親がnotInに含まれる", () => {
      const filterWhere: WhereUse = { published: true };

      mockFindMany.mockImplementation(
        (_sheet: string, findData: { where?: WhereUse }) => {
          if (!findData.where || Object.keys(findData.where).length === 0) {
            return [
              { id: 1, authorId: 1, published: false },
              { id: 2, authorId: 2, published: false },
            ];
          }
          return [];
        },
      );

      const result = applyEveryFilter(
        relation,
        "posts",
        filterWhere,
        mockFindMany,
      );

      expect(result).toEqual({ id: { notIn: [1, 2] } });
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

    it("全関連ターゲットが条件合致しない親はnotInに含まれる", () => {
      const filterWhere: WhereUse = { active: true };

      mockFindMany.mockImplementation(
        (sheet: string, findData: { where?: WhereUse }) => {
          if (sheet === "PostTags") {
            return [
              { postId: 1, tagId: 10 },
              { postId: 1, tagId: 20 },
              { postId: 2, tagId: 10 },
            ];
          }
          if (sheet === "Tags") {
            // 条件付きの場合
            if (findData.where && "active" in findData.where) {
              return [{ id: 10, active: true }];
            }
            // 全件取得
            return [
              { id: 10, active: true },
              { id: 20, active: false },
            ];
          }
          return [];
        },
      );

      const result = applyEveryFilter(
        relation,
        "tags",
        filterWhere,
        mockFindMany,
      );

      // post1: tag10(合致) + tag20(不合致) → 全数2, 合致数1 → 失敗
      // post2: tag10(合致) → 全数1, 合致数1 → 成功
      expect(result).toEqual({ id: { notIn: [1] } });
    });
  });
});
