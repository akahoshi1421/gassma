import {
  NestedWriteInvalidOperationError,
  NestedWriteTargetNotFoundError,
} from "../../../../errors/relation/nestedWriteError";
import { processOneToOneUpdate } from "../../../../util/update/nestedWrite/processOneToOneUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processOneToOneUpdate", () => {
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

  const oneToOneRelation: RelationDefinition = {
    type: "oneToOne",
    to: "Profiles",
    field: "id",
    reference: "userId",
  };

  const makeOps = (op: NestedWriteOperation) => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", op);
    return relationOps;
  };

  it("update（裸 data）で相手行が更新される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOneUpdate(
      { id: 1, name: "田中" },
      makeOps({ update: { bio: "変更後" } }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { userId: 1 },
      data: { bio: "変更後" },
    });
  });

  it("update で相手不在なら NestedWriteTargetNotFoundError", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { bio: "変更後" } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('Nested write update failed: no record found in "Profiles"');
  });

  it("update 相手不在エラーは NestedWriteTargetNotFoundError", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { bio: "変更後" } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteTargetNotFoundError);
  });

  it("disconnect: true で相手の reference 列が null 化される", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOneUpdate(
      { id: 1, name: "田中" },
      makeOps({ disconnect: true }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { userId: 1 },
      data: { userId: null },
    });
  });

  it("disconnect: true で相手不在は no-op", () => {
    mockUpdateManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ disconnect: true }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).not.toThrow();
  });

  it("disconnect に true 以外を渡すとエラー", () => {
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ disconnect: { id: 5 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteInvalidOperationError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ disconnect: { id: 5 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "disconnect" is not valid');
  });

  it("delete: true で相手行が削除される", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOneUpdate(
      { id: 1, name: "田中" },
      makeOps({ delete: true }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Profiles", {
      where: { userId: 1 },
    });
  });

  it("delete: true で相手不在なら NestedWriteTargetNotFoundError", () => {
    mockDeleteManyOnSheet.mockReturnValue({ count: 0 });

    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ delete: true }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteTargetNotFoundError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ delete: true }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('Nested write delete failed: no record found in "Profiles"');
  });

  it("delete に true 以外を渡すとエラー", () => {
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ delete: { id: 5 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteInvalidOperationError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ delete: { id: 5 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "delete" is not valid');
  });

  it("配列 update はエラー", () => {
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: [{ where: { id: 5 }, data: { bio: "a" } }] }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteInvalidOperationError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: [{ where: { id: 5 }, data: { bio: "a" } }] }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "update" is not valid');
  });

  it("where/data 形式の update はエラー", () => {
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { where: { id: 5 }, data: { bio: "a" } } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteInvalidOperationError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ update: { where: { id: 5 }, data: { bio: "a" } } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "update" is not valid');
  });

  it("set はエラー", () => {
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ set: [{ id: 5 }] }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteInvalidOperationError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ set: [{ id: 5 }] }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "set" is not valid');
  });

  it("deleteMany はエラー", () => {
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ deleteMany: { id: 5 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow(NestedWriteInvalidOperationError);
    expect(() =>
      processOneToOneUpdate(
        { id: 1, name: "田中" },
        makeOps({ deleteMany: { id: 5 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "deleteMany" is not valid');
  });

  it("manyToOne は無視される", () => {
    processOneToOneUpdate(
      { id: 1, title: "記事A", authorId: 5 },
      makeOps({ update: { name: "変更後" } }),
      makeContext({
        profile: {
          type: "manyToOne",
          to: "Users",
          field: "authorId",
          reference: "id",
        },
      }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("親の field 値が欠落している場合はスキップ", () => {
    processOneToOneUpdate(
      { name: "田中" },
      makeOps({ delete: true }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockDeleteManyOnSheet).not.toHaveBeenCalled();
  });
});
