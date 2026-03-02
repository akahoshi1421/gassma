import { resolveOnUpdate } from "../../../../util/relation/onUpdate/resolveOnUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";

describe("resolveOnUpdate", () => {
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

  it("onUpdate 未定義の場合は何もしない", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      },
    };

    resolveOnUpdate([{ id: 1 }], [{ id: 1 }], baseContext(relations));

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
        onUpdate: "NoAction",
      },
    };

    resolveOnUpdate([{ id: 1 }], [{ id: 2 }], baseContext(relations));

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("PKが変更されていない場合は何もしない", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onUpdate: "Cascade",
      },
    };

    resolveOnUpdate(
      [{ id: 1, name: "old" }],
      [{ id: 1, name: "new" }],
      baseContext(relations),
    );

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("Cascade（oneToMany）で子レコードのFKが新値に更新される", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onUpdate: "Cascade",
      },
    };

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 10 }, { id: 20 }],
      baseContext(relations),
    );

    expect(mockUpdateMany).toHaveBeenCalledWith("Posts", {
      where: { authorId: 1 },
      data: { authorId: 10 },
    });
    expect(mockUpdateMany).toHaveBeenCalledWith("Posts", {
      where: { authorId: 2 },
      data: { authorId: 20 },
    });
  });

  it("Cascade（manyToMany）で中間テーブルのfieldが新値に更新される", () => {
    const relations: Record<string, RelationDefinition> = {
      tags: {
        type: "manyToMany",
        to: "Tags",
        field: "id",
        reference: "id",
        through: { sheet: "PostTags", field: "postId", reference: "tagId" },
        onUpdate: "Cascade",
      },
    };

    resolveOnUpdate([{ id: 1 }], [{ id: 10 }], baseContext(relations));

    expect(mockUpdateMany).toHaveBeenCalledWith("PostTags", {
      where: { postId: 1 },
      data: { postId: 10 },
    });
  });

  it("SetNull で子レコードのFKがnullに更新される", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onUpdate: "SetNull",
      },
    };

    resolveOnUpdate([{ id: 1 }], [{ id: 10 }], baseContext(relations));

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
        onUpdate: "SetNull",
      },
    };

    resolveOnUpdate([{ id: 1 }], [{ id: 10 }], baseContext(relations));

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
        onUpdate: "Restrict",
      },
    };

    mockFindMany.mockReturnValue([{ id: 101, authorId: 1 }]);

    expect(() =>
      resolveOnUpdate([{ id: 1 }], [{ id: 10 }], baseContext(relations)),
    ).toThrow("posts");
  });

  it("Restrict で子レコードが存在しない場合エラーを投げない", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onUpdate: "Restrict",
      },
    };

    mockFindMany.mockReturnValue([]);

    expect(() =>
      resolveOnUpdate([{ id: 1 }], [{ id: 10 }], baseContext(relations)),
    ).not.toThrow();
  });

  it("複数リレーションでRestrictを先にチェックしてからCascadeを実行する", () => {
    const relations: Record<string, RelationDefinition> = {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onUpdate: "Cascade",
      },
      comments: {
        type: "oneToMany",
        to: "Comments",
        field: "id",
        reference: "userId",
        onUpdate: "Restrict",
      },
    };

    mockFindMany.mockReturnValue([{ id: 201, userId: 1 }]);

    expect(() =>
      resolveOnUpdate([{ id: 1 }], [{ id: 10 }], baseContext(relations)),
    ).toThrow("comments");

    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
