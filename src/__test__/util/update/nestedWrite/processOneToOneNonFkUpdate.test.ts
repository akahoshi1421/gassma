import { processOneToOneNonFkUpdate } from "../../../../util/update/nestedWrite/processOneToOneNonFkUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processOneToOneNonFkUpdate", () => {
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

  const nonFkRelation: RelationDefinition = {
    type: "oneToOne",
    to: "Profiles",
    field: "id",
    reference: "userId",
    ownsFk: false,
  };

  const makeOps = (op: NestedWriteOperation) => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", op);
    return relationOps;
  };

  it("update（裸 data）で相手行が更新される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOneNonFkUpdate(
      { id: 1, name: "田中" },
      makeOps({ update: { bio: "変更後" } }),
      makeContext({ profile: nonFkRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { userId: 1 },
      data: { bio: "変更後" },
    });
  });

  it("update で相手不在なら NestedWriteTargetNotFoundError", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { bio: "変更後" } }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('Nested write update failed: no record found in "Profiles"');
  });

  it("update 相手不在エラーの name は NestedWriteTargetNotFoundError", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 0 });

    let caught: unknown;
    try {
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { bio: "変更後" } }),
        makeContext({ profile: nonFkRelation }),
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).name).toBe("NestedWriteTargetNotFoundError");
  });

  it("disconnect: true で相手の reference 列が null 化される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOneNonFkUpdate(
      { id: 1, name: "田中" },
      makeOps({ disconnect: true }),
      makeContext({ profile: nonFkRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { userId: 1 },
      data: { userId: null },
    });
  });

  it("disconnect: true で相手不在は no-op", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ disconnect: true }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).not.toThrow();
  });

  it("disconnect に true 以外を渡すとエラー", () => {
    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ disconnect: { id: 5 } }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('operation "disconnect" is not valid');
  });

  it("delete: true で相手行が削除される", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOneNonFkUpdate(
      { id: 1, name: "田中" },
      makeOps({ delete: true }),
      makeContext({ profile: nonFkRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { userId: 1 },
    });
  });

  it("delete: true で相手不在なら NestedWriteTargetNotFoundError", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ delete: true }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('Nested write delete failed: no record found in "Profiles"');
  });

  it("delete に true 以外を渡すとエラー", () => {
    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ delete: { id: 5 } }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('operation "delete" is not valid');
  });

  it("配列 update はエラー", () => {
    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: [{ where: { id: 5 }, data: { bio: "a" } }] }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('operation "update" is not valid');
  });

  it("where/data 形式の update はエラー", () => {
    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { where: { id: 5 }, data: { bio: "a" } } }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('operation "update" is not valid');
  });

  it("set はエラー", () => {
    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ set: [{ id: 5 }] }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('operation "set" is not valid');
  });

  it("deleteMany はエラー", () => {
    expect(() =>
      processOneToOneNonFkUpdate(
        { id: 1, name: "田中" },
        makeOps({ deleteMany: { id: 5 } }),
        makeContext({ profile: nonFkRelation }),
      ),
    ).toThrow('operation "deleteMany" is not valid');
  });

  it("ownsFk 未指定の oneToOne は無視される", () => {
    processOneToOneNonFkUpdate(
      { id: 1, name: "田中" },
      makeOps({ update: { bio: "変更後" } }),
      makeContext({
        profile: {
          type: "oneToOne",
          to: "Profiles",
          field: "profileId",
          reference: "id",
        },
      }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("manyToOne は無視される", () => {
    processOneToOneNonFkUpdate(
      { id: 1, title: "記事A", authorId: 5 },
      makeOps({ update: { name: "変更後" } }),
      makeContext({
        profile: {
          type: "manyToOne",
          to: "Users",
          field: "authorId",
          reference: "id",
          ownsFk: true,
        },
      }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("親の field 値が欠落している場合はスキップ", () => {
    processOneToOneNonFkUpdate(
      { name: "田中" },
      makeOps({ delete: true }),
      makeContext({ profile: nonFkRelation }),
    );

    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
  });
});
