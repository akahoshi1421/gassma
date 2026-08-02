import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../../errors/argument/argumentError";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import type { WhereUse } from "../../../../types/coreTypes";
import { resolveWhereRelation } from "../../../../util/relation/whereRelation/resolveWhereRelation";
import { buildTestClient, sheetOf } from "../../extends/extendsTestClient";

const relations: { [relationName: string]: RelationDefinition } = {
  posts: {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  },
  author: {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  },
  profile: {
    type: "oneToOne",
    to: "Profiles",
    field: "id",
    reference: "userId",
  },
  tags: {
    type: "manyToMany",
    to: "Tags",
    field: "id",
    reference: "id",
    through: {
      sheet: "PostTags",
      field: "postId",
      reference: "tagId",
    },
  },
};

const mockFindMany = jest.fn();

const context: RelationContext = {
  relations,
  findManyOnSheet: mockFindMany,
};

beforeEach(() => {
  mockFindMany.mockReset();
});

describe("to-one の短縮形は暗黙の is として解決される", () => {
  test("manyToOne: { author: { name } } は { author: { is: { name } } } と同じ", () => {
    mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);
    const shorthand = resolveWhereRelation(
      { author: { name: "Alice" } },
      {
        ...context,
      },
    );

    mockFindMany.mockReturnValue([{ id: 1, name: "Alice" }]);
    const explicit = resolveWhereRelation(
      { author: { is: { name: "Alice" } } },
      { ...context },
    );

    expect(shorthand).toEqual(explicit);
    expect(shorthand).toEqual({ AND: [{ authorId: { in: [1] } }] });
  });

  test("oneToOne: { profile: { bio } } も暗黙の is", () => {
    mockFindMany.mockReturnValue([{ id: 301, userId: 1, bio: "dev" }]);
    const result = resolveWhereRelation({ profile: { bio: "dev" } }, context);
    expect(result).toEqual({ AND: [{ id: { in: [1] } }] });
  });
});

describe("to-many の短縮形は専用エラー", () => {
  test("oneToMany: { posts: { title } } は some/every/none を案内する", () => {
    const fn = () =>
      resolveWhereRelation({ posts: { title: "Post A" } }, context);
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `title`.\n\nAvailable: some, every, none",
    );
  });

  test("フィルタキーの typo (som) はサジェスト付き", () => {
    const fn = () =>
      resolveWhereRelation({ posts: { som: { title: "x" } } }, context);
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `som`. Did you mean `some`?");
  });

  test("manyToMany の短縮形も同じエラー", () => {
    expect(() =>
      resolveWhereRelation({ tags: { label: "tech" } }, context),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("空オブジェクトは GassmaInvalidValueError", () => {
    expect(() => resolveWhereRelation({ posts: {} }, context)).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("リレーション名に不正な値", () => {
  test("非 dict 値は GassmaInvalidValueError", () => {
    expect(() => resolveWhereRelation({ author: 5 }, context)).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("null は従来どおり null ショートハンド", () => {
    const where: WhereUse = { author: null };
    expect(resolveWhereRelation(where, context)).toEqual({
      AND: [{ authorId: null }],
    });
  });
});

describe("クライアント経由の実挙動", () => {
  test("短縮形と is 明示で同じ結果になる", () => {
    const posts = sheetOf(buildTestClient({ relations: true }), "Posts");
    const shorthand = posts.findMany({
      where: { author: { name: "Alice" } },
    });
    const explicit = posts.findMany({
      where: { author: { is: { name: "Alice" } } },
    });
    expect(shorthand).toEqual(explicit);
    expect(shorthand).toEqual([{ id: 101, authorId: 1, title: "Post A" }]);
  });

  test("to-many の短縮形はエラーになりシートが変化しない", () => {
    const client = buildTestClient({ relations: true });
    const users = sheetOf(client, "Users");
    const loose: any = users;
    expect(() =>
      loose.deleteMany({ where: { posts: { title: "Post A" } } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(users.count({})).toBe(3);
  });
});
