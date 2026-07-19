import { resolveManyToOne } from "../../../../util/relation/resolvers/manyToOne";
import type { RelationDefinition } from "../../../../types/relationTypes";
import { GassmaRelationDuplicateError } from "../../../../errors/relation/relationError";
import { createCrossRealmDate } from "../../../consts/crossRealm";

describe("resolveManyToOne", () => {
  const relation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("親レコードのFK値から対応する参照先を単一オブジェクトで付与する", () => {
    const parents = [
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 2, title: "Post B" },
      { id: 103, authorId: 1, title: "Post C" },
    ];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany);

    expect(result[0]).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
      author: { id: 1, name: "Alice" },
    });
    expect(result[1]).toEqual({
      id: 102,
      authorId: 2,
      title: "Post B",
      author: { id: 2, name: "Bob" },
    });
    expect(result[2]).toEqual({
      id: 103,
      authorId: 1,
      title: "Post C",
      author: { id: 1, name: "Alice" },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: { in: [1, 2, 1] } },
    });
  });

  it("FK値がnullの場合はnullを付与する", () => {
    const parents = [{ id: 101, authorId: null, title: "Draft" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany);

    expect(result[0]).toEqual({
      id: 101,
      authorId: null,
      title: "Draft",
      author: null,
    });
  });

  it("対応する参照先がない場合はnullを付与する", () => {
    const parents = [{ id: 101, authorId: 999, title: "Orphan" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany);

    expect(result[0]).toEqual({
      id: 101,
      authorId: 999,
      title: "Orphan",
      author: null,
    });
  });

  it("includeオプションのwhereをAND結合して渡す", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice", active: true }]);

    resolveManyToOne(parents, relation, "author", mockFindMany, {
      where: { active: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: {
        AND: [{ id: { in: [1] } }, { active: true }],
      },
    });
  });

  it("親レコードが空配列の場合はfindManyを呼ばず空配列を返す", () => {
    const result = resolveManyToOne([], relation, "author", mockFindMany);

    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("selectオプションで参照先レコードのフィールドを絞り込む", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice", email: "alice@test.com" },
    ]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany, {
      select: { id: true, name: true },
    });

    expect(result[0].author).toEqual({ id: 1, name: "Alice" });
  });

  it("omitオプションで参照先レコードのフィールドを除外する", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice", email: "alice@test.com" },
    ]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany, {
      omit: { email: true },
    });

    expect(result[0].author).toEqual({ id: 1, name: "Alice" });
  });

  it("omit の false エントリのみを findManyOnSheet に渡す", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice", email: "alice@test.com" },
    ]);

    resolveManyToOne(parents, relation, "author", mockFindMany, {
      omit: { email: true, password: false },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: { in: [1] } },
      omit: { password: false },
    });
  });

  it("FK値がnullの場合selectオプションがあってもnullを返す", () => {
    const parents = [{ id: 101, authorId: null, title: "Draft" }];

    mockFindMany.mockReturnValue([]);

    const result = resolveManyToOne(parents, relation, "author", mockFindMany, {
      select: { id: true, name: true },
    });

    expect(result[0].author).toBeNull();
  });

  it("includeオプション付きでfindManyOnSheetにincludeが渡される", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);

    resolveManyToOne(parents, relation, "author", mockFindMany, {
      include: { profile: true },
    });

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: { in: [1] } },
      include: { profile: true },
    });
  });

  it("reference側に重複がある場合はエラーを投げる", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice" },
      { id: 1, name: "Alice Duplicate" },
    ]);

    expect(() =>
      resolveManyToOne(parents, relation, "author", mockFindMany),
    ).toThrow('Duplicate value "1" found in "Users.id" for a unique relation');
  });

  it("targetRelationNames にある select 内の true 形式 relation を include として解決する", () => {
    const parents = [{ id: 101, authorId: 1, title: "Post A" }];

    mockFindMany.mockReturnValue([
      {
        id: 1,
        name: "Alice",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      },
    ]);

    const result = resolveManyToOne(
      parents,
      relation,
      "author",
      mockFindMany,
      { select: { name: true, posts: true } },
      ["posts"],
    );

    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: { in: [1] } },
      include: { posts: true },
    });
    expect(result[0].author).toEqual({
      name: "Alice",
      posts: [{ id: 101, authorId: 1, title: "Post A" }],
    });
  });
});

describe("resolveManyToOne with Date keys", () => {
  const dateRelation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "joinedAt",
    reference: "createdAt",
  };

  const mockFindMany = jest.fn();

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("同時刻・別インスタンスのDate FKで参照先が解決される", () => {
    const parents = [
      { id: 101, joinedAt: new Date("2026-07-18T09:30:00.000Z") },
    ];

    mockFindMany.mockReturnValue([
      { createdAt: new Date("2026-07-18T09:30:00.000Z"), name: "Alice" },
    ]);

    const result = resolveManyToOne(
      parents,
      dateRelation,
      "author",
      mockFindMany,
    );

    expect(result[0].author).toEqual({
      createdAt: new Date("2026-07-18T09:30:00.000Z"),
      name: "Alice",
    });
  });

  it("ミリ秒差のDate FKはマッチせずnullになる", () => {
    const parents = [
      { id: 101, joinedAt: new Date("2026-07-18T09:30:00.001Z") },
    ];

    mockFindMany.mockReturnValue([
      { createdAt: new Date("2026-07-18T09:30:00.000Z"), name: "Alice" },
    ]);

    const result = resolveManyToOne(
      parents,
      dateRelation,
      "author",
      mockFindMany,
    );

    expect(result[0].author).toBeNull();
  });

  it("Date FKとISO文字列の参照はマッチしない", () => {
    const parents = [
      { id: 101, joinedAt: new Date("2026-07-18T09:30:00.000Z") },
    ];

    mockFindMany.mockReturnValue([
      { createdAt: "2026-07-18T09:30:00.000Z", name: "Alice" },
    ]);

    const result = resolveManyToOne(
      parents,
      dateRelation,
      "author",
      mockFindMany,
    );

    expect(result[0].author).toBeNull();
  });

  it("同時刻・別インスタンスの参照の重複はエラーになる", () => {
    const parents = [
      { id: 101, joinedAt: new Date("2026-07-18T09:30:00.000Z") },
    ];

    mockFindMany.mockReturnValue([
      { createdAt: new Date("2026-07-18T09:30:00.000Z"), name: "Alice" },
      { createdAt: new Date("2026-07-18T09:30:00.000Z"), name: "Alice2" },
    ]);

    expect(() =>
      resolveManyToOne(parents, dateRelation, "author", mockFindMany),
    ).toThrow(GassmaRelationDuplicateError);
  });

  it("クロスrealmのDate FKでも参照先が解決される", () => {
    const parents = [
      { id: 101, joinedAt: createCrossRealmDate("2026-07-18T09:30:00.000Z") },
    ];

    mockFindMany.mockReturnValue([
      { createdAt: new Date("2026-07-18T09:30:00.000Z"), name: "Alice" },
    ]);

    const result = resolveManyToOne(
      parents,
      dateRelation,
      "author",
      mockFindMany,
    );

    expect(result[0].author).not.toBeNull();
  });
});
