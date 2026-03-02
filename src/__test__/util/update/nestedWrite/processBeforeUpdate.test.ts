import { processBeforeUpdate } from "../../../../util/update/nestedWrite/processBeforeUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processBeforeUpdate", () => {
  const mockFindMany = jest.fn();
  const mockUpdateManyOnSheet = jest.fn();
  const mockDeleteManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    updateManyOnSheet: mockUpdateManyOnSheet,
    deleteManyOnSheet: mockDeleteManyOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockUpdateManyOnSheet.mockReset();
    mockDeleteManyOnSheet.mockReset();
  });

  const manyToOneRelation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  const oneToOneRelation: RelationDefinition = {
    type: "oneToOne",
    to: "Profiles",
    field: "profileId",
    reference: "id",
  };

  const oneToManyRelation: RelationDefinition = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

  it("manyToOne + update で対象レコードが更新される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { update: { name: "佐藤" } });

    const enrichedData = { title: "記事A", authorId: 1 };
    processBeforeUpdate(
      { title: "記事A", authorId: 1 },
      enrichedData,
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Users", {
      where: { id: 1 },
      data: { name: "佐藤" },
    });
  });

  it("oneToOne + update で対象レコードが更新される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", { update: { bio: "新しい自己紹介" } });

    const enrichedData = { name: "田中", profileId: 5 };
    processBeforeUpdate(
      { name: "田中", profileId: 5 },
      enrichedData,
      relationOps,
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { id: 5 },
      data: { bio: "新しい自己紹介" },
    });
  });

  it("manyToOne + delete: true で対象が削除され FK が null になる", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { delete: true });

    const enrichedData = { title: "記事A", authorId: 1 };
    processBeforeUpdate(
      { title: "記事A", authorId: 1 },
      enrichedData,
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Users", {
      where: { id: 1 },
    });
    expect(enrichedData.authorId).toBeNull();
  });

  it("FK が null の場合スキップ", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { update: { name: "佐藤" } });

    const enrichedData = { title: "記事A", authorId: null };
    processBeforeUpdate(
      { title: "記事A", authorId: null },
      enrichedData,
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("manyToOne + disconnect: true で FK が null になる（関連先は削除されない）", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { disconnect: true });

    const enrichedData: Record<string, unknown> = {
      title: "記事A",
      authorId: 1,
    };
    processBeforeUpdate(
      { title: "記事A", authorId: 1 },
      enrichedData,
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(enrichedData.authorId).toBeNull();
    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("oneToOne + disconnect: true で FK が null になる", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", { disconnect: true });

    const enrichedData: Record<string, unknown> = {
      name: "田中",
      profileId: 5,
    };
    processBeforeUpdate(
      { name: "田中", profileId: 5 },
      enrichedData,
      relationOps,
      makeContext({ profile: oneToOneRelation }),
    );

    expect(enrichedData.profileId).toBeNull();
    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("manyToOne + disconnect に true 以外を渡すとエラー", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { disconnect: { id: 1 } });

    const enrichedData: Record<string, unknown> = {
      title: "記事A",
      authorId: 1,
    };

    expect(() =>
      processBeforeUpdate(
        { title: "記事A", authorId: 1 },
        enrichedData,
        relationOps,
        makeContext({ author: manyToOneRelation }),
      ),
    ).toThrow("disconnect");
  });

  it("oneToOne + disconnect に true 以外を渡すとエラー", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", { disconnect: { id: 5 } });

    const enrichedData: Record<string, unknown> = {
      name: "田中",
      profileId: 5,
    };

    expect(() =>
      processBeforeUpdate(
        { name: "田中", profileId: 5 },
        enrichedData,
        relationOps,
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow("disconnect");
  });

  it("oneToMany は無視される", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", {
      update: { where: { id: 1 }, data: { title: "変更" } },
    });

    const enrichedData = { id: 1, name: "田中" };
    processBeforeUpdate(
      { id: 1, name: "田中" },
      enrichedData,
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
  });
});
