import { processOneToOne } from "../../../../util/create/nestedWrite/processOneToOne";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processOneToOne", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();
  const mockUpdateManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    createOnSheet: mockCreateOnSheet,
    updateManyOnSheet: mockUpdateManyOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateOnSheet.mockReset();
    mockUpdateManyOnSheet.mockReset();
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

  it("create で子が親の field 値付きで作成される", () => {
    mockCreateOnSheet.mockReturnValue({ id: 10, bio: "自己紹介", userId: 1 });

    processOneToOne(
      { id: 1, name: "田中" },
      makeOps({ create: { bio: "自己紹介" } }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockCreateOnSheet).toHaveBeenCalledWith("Profiles", {
      data: { bio: "自己紹介", userId: 1 },
    });
  });

  it("connect で既接続行の解除後に対象行へ親値が設定される", () => {
    mockFindMany.mockReturnValue([{ id: 5, userId: null }]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOne(
      { id: 1, name: "田中" },
      makeOps({ connect: { id: 5 } }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).toHaveBeenNthCalledWith(1, "Profiles", {
      where: { userId: 1 },
      data: { userId: null },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenNthCalledWith(2, "Profiles", {
      where: { id: 5 },
      data: { userId: 1 },
    });
  });

  it("connect 対象不在で NestedWriteConnectNotFoundError", () => {
    mockFindMany.mockReturnValue([]);

    expect(() =>
      processOneToOne(
        { id: 1, name: "田中" },
        makeOps({ connect: { id: 999 } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('no record found in "Profiles"');
    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("connectOrCreate で対象ありなら connect 相当（置き換え含む）", () => {
    mockFindMany.mockReturnValue([{ id: 5, userId: 99 }]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    processOneToOne(
      { id: 1, name: "田中" },
      makeOps({
        connectOrCreate: { where: { id: 5 }, create: { bio: "自己紹介" } },
      }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockCreateOnSheet).not.toHaveBeenCalled();
    expect(mockUpdateManyOnSheet).toHaveBeenNthCalledWith(1, "Profiles", {
      where: { userId: 1 },
      data: { userId: null },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenNthCalledWith(2, "Profiles", {
      where: { id: 5 },
      data: { userId: 1 },
    });
  });

  it("connectOrCreate で対象なしなら create 相当", () => {
    mockFindMany.mockReturnValue([]);
    mockCreateOnSheet.mockReturnValue({ id: 10, bio: "自己紹介", userId: 1 });

    processOneToOne(
      { id: 1, name: "田中" },
      makeOps({
        connectOrCreate: { where: { id: 5 }, create: { bio: "自己紹介" } },
      }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Profiles", {
      data: { bio: "自己紹介", userId: 1 },
    });
  });

  it("createMany は NestedWriteInvalidOperationError", () => {
    expect(() =>
      processOneToOne(
        { id: 1, name: "田中" },
        makeOps({ createMany: { data: [{ bio: "自己紹介" }] } }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "createMany" is not valid');
  });

  it("配列 create は NestedWriteInvalidOperationError", () => {
    expect(() =>
      processOneToOne(
        { id: 1, name: "田中" },
        makeOps({ create: [{ bio: "自己紹介" }] }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "create" is not valid');
  });

  it("配列 connect は NestedWriteInvalidOperationError", () => {
    expect(() =>
      processOneToOne(
        { id: 1, name: "田中" },
        makeOps({ connect: [{ id: 5 }] }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "connect" is not valid');
  });

  it("配列 connectOrCreate は NestedWriteInvalidOperationError", () => {
    expect(() =>
      processOneToOne(
        { id: 1, name: "田中" },
        makeOps({
          connectOrCreate: [{ where: { id: 5 }, create: { bio: "a" } }],
        }),
        makeContext({ profile: oneToOneRelation }),
      ),
    ).toThrow('operation "connectOrCreate" is not valid');
  });

  it("親の field 値が欠落している場合はスキップ", () => {
    processOneToOne(
      { name: "田中" },
      makeOps({ create: { bio: "自己紹介" } }),
      makeContext({ profile: oneToOneRelation }),
    );

    expect(mockCreateOnSheet).not.toHaveBeenCalled();
    expect(mockUpdateManyOnSheet).not.toHaveBeenCalled();
  });

  it("manyToOne（FK 保有側）は無視される", () => {
    processOneToOne(
      { id: 1, name: "田中" },
      makeOps({ create: { bio: "自己紹介" } }),
      makeContext({
        profile: {
          type: "manyToOne",
          to: "Profiles",
          field: "profileId",
          reference: "id",
        },
      }),
    );

    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("oneToMany は無視される", () => {
    processOneToOne(
      { id: 1, name: "田中" },
      makeOps({ create: { title: "記事A" } }),
      makeContext({
        profile: {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
        },
      }),
    );

    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });
});
