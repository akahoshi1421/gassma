import { resolveOnDelete } from "../../../../util/relation/onDelete/resolveOnDelete";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";

describe("resolveOnDelete", () => {
  const mockFindMany = jest.fn();
  const mockDeleteMany = jest.fn();
  const mockUpdateMany = jest.fn();

  const baseContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    deleteManyOnSheet: mockDeleteMany,
    updateManyOnSheet: mockUpdateMany,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockDeleteMany.mockReset();
    mockUpdateMany.mockReset();
  });

  it("onDelete 未定義の場合は何もしない", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      },
    };

    resolveOnDelete([{ id: 1 }], baseContext(relations));

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("NoAction の場合は何もしない", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "NoAction",
      },
    };

    resolveOnDelete([{ id: 1 }], baseContext(relations));

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("Cascade（oneToMany）で子レコードを削除する", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "Cascade",
      },
    };

    resolveOnDelete([{ id: 1 }, { id: 2 }], baseContext(relations));

    expect(mockDeleteMany).toHaveBeenCalledWith("Posts", {
      where: { authorId: { in: [1, 2] } },
    });
  });

  it("Cascade（manyToMany）で中間テーブルの行を削除する", () => {
    const relations: Record<string, RelationDefinition> = {
      tags: {
        type: "manyToMany",
        to: "Tags",
        field: "id",
        reference: "id",
        through: { sheet: "PostTags", field: "postId", reference: "tagId" },
        onDelete: "Cascade",
      },
    };

    resolveOnDelete([{ id: 1 }], baseContext(relations));

    expect(mockDeleteMany).toHaveBeenCalledWith("PostTags", {
      where: { postId: { in: [1] } },
    });
  });

  it("SetNull で子レコードのFKをnullに更新する", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "SetNull",
      },
    };

    resolveOnDelete([{ id: 1 }], baseContext(relations));

    expect(mockUpdateMany).toHaveBeenCalledWith("Posts", {
      where: { authorId: { in: [1] } },
      data: { authorId: null },
    });
  });

  it("SetNull + manyToMany はスキップされる", () => {
    const relations: Record<string, RelationDefinition> = {
      tags: {
        type: "manyToMany",
        to: "Tags",
        field: "id",
        reference: "id",
        through: { sheet: "PostTags", field: "postId", reference: "tagId" },
        onDelete: "SetNull",
      },
    };

    resolveOnDelete([{ id: 1 }], baseContext(relations));

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });

  it("Restrict で子レコードが存在する場合エラーを投げる", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "Restrict",
      },
    };

    mockFindMany.mockReturnValue([{ id: 101, authorId: 1 }]);

    expect(() => resolveOnDelete([{ id: 1 }], baseContext(relations))).toThrow(
      "posts",
    );
  });

  it("Restrict で子レコードが存在しない場合エラーを投げない", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "Restrict",
      },
    };

    mockFindMany.mockReturnValue([]);

    expect(() =>
      resolveOnDelete([{ id: 1 }], baseContext(relations)),
    ).not.toThrow();
  });

  it("複数リレーションでRestrictを全て先にチェックしてからCascade/SetNullを実行する", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "Cascade",
      },
      comments: {
        type: "oneToMany",
        to: "Comments",
        field: "id",
        reference: "userId",
        onDelete: "Restrict",
      },
    };

    mockFindMany.mockReturnValue([{ id: 201, userId: 1 }]);

    expect(() => resolveOnDelete([{ id: 1 }], baseContext(relations))).toThrow(
      "comments",
    );

    // Restrict でエラーになるので Cascade は呼ばれない
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
});
