import { NestedWriteConnectNotFoundError } from "../../../../errors/relation/nestedWriteError";
import { processBeforeCreate } from "../../../../util/create/nestedWrite/processBeforeCreate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";

describe("processBeforeCreate", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    createOnSheet: mockCreateOnSheet,
  });

  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateOnSheet.mockReset();
  });

  const manyToOneRelation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  const fkSideProfileRelation: RelationDefinition = {
    type: "manyToOne",
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

  const oneToOneRelation: RelationDefinition = {
    type: "oneToOne",
    to: "Profiles",
    field: "id",
    reference: "userId",
  };

  it("manyToOne + connect で既存レコードのFK値が親データに設定される", () => {
    mockFindMany.mockReturnValue([{ id: 1, name: "田中" }]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { connect: { id: 1 } });

    const result = processBeforeCreate(
      { title: "記事A" },
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ title: "記事A", authorId: 1 });
    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: 1 },
    });
  });

  it("manyToOne + connect でレコードが見つからない場合エラーを投げる", () => {
    mockFindMany.mockReturnValue([]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { connect: { id: 999 } });

    expect(() =>
      processBeforeCreate(
        { title: "記事A" },
        relationOps,
        makeContext({ author: manyToOneRelation }),
      ),
    ).toThrow(NestedWriteConnectNotFoundError);
    expect(() =>
      processBeforeCreate(
        { title: "記事A" },
        relationOps,
        makeContext({ author: manyToOneRelation }),
      ),
    ).toThrow("Users");
  });

  it("manyToOne + create でターゲットシートに作成しFK値が設定される", () => {
    mockCreateOnSheet.mockReturnValue({ id: 1, name: "田中" });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("author", { create: { id: 1, name: "田中" } });

    const result = processBeforeCreate(
      { title: "記事A" },
      relationOps,
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ title: "記事A", authorId: 1 });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Users", {
      data: { id: 1, name: "田中" },
    });
  });

  it("FK 保有側 1:1（manyToOne）+ connectOrCreate で既存レコードがある場合FK値が設定される", () => {
    mockFindMany.mockReturnValue([{ id: 5, bio: "自己紹介" }]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", {
      connectOrCreate: {
        where: { id: 5 },
        create: { id: 5, bio: "自己紹介" },
      },
    });

    const result = processBeforeCreate(
      { name: "田中" },
      relationOps,
      makeContext({ profile: fkSideProfileRelation }),
    );

    expect(result).toEqual({ name: "田中", profileId: 5 });
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("FK 保有側 1:1（manyToOne）+ connectOrCreate で既存レコードがない場合新規作成しFK値が設定される", () => {
    mockFindMany.mockReturnValue([]);
    mockCreateOnSheet.mockReturnValue({ id: 5, bio: "自己紹介" });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", {
      connectOrCreate: {
        where: { id: 5 },
        create: { id: 5, bio: "自己紹介" },
      },
    });

    const result = processBeforeCreate(
      { name: "田中" },
      relationOps,
      makeContext({ profile: fkSideProfileRelation }),
    );

    expect(result).toEqual({ name: "田中", profileId: 5 });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Profiles", {
      data: { id: 5, bio: "自己紹介" },
    });
  });

  it("oneToMany のリレーションは無視される", () => {
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("posts", { create: [{ title: "記事A" }] });

    const result = processBeforeCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ posts: oneToManyRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("oneToOne + connect は素通りし親データ・関連先に触れない", () => {
    mockFindMany.mockReturnValue([{ id: 5, userId: 99 }]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", { connect: { id: 5 } });

    const result = processBeforeCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ profile: oneToOneRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("oneToOne + create は素通りする", () => {
    mockCreateOnSheet.mockReturnValue({ id: 5, userId: 99 });
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", { create: { bio: "自己紹介" } });

    const result = processBeforeCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ profile: oneToOneRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("oneToOne + connectOrCreate は素通りする", () => {
    mockFindMany.mockReturnValue([{ id: 5, userId: 99 }]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", {
      connectOrCreate: { where: { id: 5 }, create: { bio: "自己紹介" } },
    });

    const result = processBeforeCreate(
      { id: 1, name: "田中" },
      relationOps,
      makeContext({ profile: oneToOneRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCreateOnSheet).not.toHaveBeenCalled();
  });

  it("FK 保有側 1:1 は manyToOne として before で処理される", () => {
    mockFindMany.mockReturnValue([{ id: 5, bio: "自己紹介" }]);
    const relationOps = new Map<string, NestedWriteOperation>();
    relationOps.set("profile", { connect: { id: 5 } });

    const result = processBeforeCreate(
      { name: "田中" },
      relationOps,
      makeContext({ profile: fkSideProfileRelation }),
    );

    expect(result).toEqual({ name: "田中", profileId: 5 });
  });
});
