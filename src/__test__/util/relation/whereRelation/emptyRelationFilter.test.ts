import { GassmaClient } from "../../../../gassma";
import type { GassmaController } from "../../../../gassmaController";
import type {
  RelationContext,
  RelationDefinition,
  RelationsConfig,
} from "../../../../types/relationTypes";
import { resolveWhereRelation } from "../../../../util/relation/whereRelation/resolveWhereRelation";

const unitRelations: { [relationName: string]: RelationDefinition } = {
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

const unitContext: RelationContext = {
  relations: unitRelations,
  findManyOnSheet: mockFindMany,
};

beforeEach(() => {
  mockFindMany.mockReset();
});

describe("リレーション名への裸の空オブジェクトは no-op", () => {
  test("oneToMany: { posts: {} } は条件を発行しない", () => {
    expect(resolveWhereRelation({ posts: {} }, unitContext)).toEqual({});
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("manyToOne: { author: {} } は暗黙 is で包まれない", () => {
    expect(resolveWhereRelation({ author: {} }, unitContext)).toEqual({});
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("oneToOne: { profile: {} } も no-op", () => {
    expect(resolveWhereRelation({ profile: {} }, unitContext)).toEqual({});
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("manyToMany: { tags: {} } も no-op", () => {
    expect(resolveWhereRelation({ tags: {} }, unitContext)).toEqual({});
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test("他の条件と併用したら空リレーションだけ取り除かれる", () => {
    expect(
      resolveWhereRelation({ author: {}, title: "Hello" }, unitContext),
    ).toEqual({ title: "Hello" });
  });

  test("論理キー配下でも取り除かれる", () => {
    expect(resolveWhereRelation({ OR: [{ author: {} }] }, unitContext)).toEqual(
      { OR: [{}] },
    );
  });

  test("{ author: {} } と { author: { is: {} } } は解決結果が異なる", () => {
    const bare = resolveWhereRelation({ author: {} }, unitContext);

    mockFindMany.mockReturnValue([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Carol" },
    ]);
    const explicit = resolveWhereRelation({ author: { is: {} } }, unitContext);

    expect(bare).toEqual({});
    expect(explicit).toEqual({ AND: [{ authorId: { in: [1, 2, 3] } }] });
  });
});

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => { getValues: () => unknown[][] };
  getDataRange: () => { getValues: () => unknown[][] };
};

const makeSheet = (name: string, data: unknown[][]): MockSheet => ({
  getName: () => name,
  getLastRow: () => data.length,
  getLastColumn: () => data[0].length,
  getRange: (row, col, numRows, numCols) => ({
    getValues: () =>
      data
        .slice(row - 1, row - 1 + numRows)
        .map((r) => r.slice(col - 1, col - 1 + numCols)),
  }),
  getDataRange: () => ({ getValues: () => data }),
});

const sheets = [
  makeSheet("Users", [
    ["id", "name"],
    [1, "Alice"],
    [2, "Bob"],
    [3, "Carol"],
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [11, 1, "Hello"],
    [12, 2, "Spam"],
    [13, "", "Orphan"],
  ]),
  makeSheet("Profiles", [
    ["id", "userId", "bio"],
    [301, 1, "Alice bio"],
    [302, 2, "Bob bio"],
  ]),
];

const mockSpreadsheet = {
  getId: () => "test-spreadsheet",
  getSheets: () => sheets,
  getSheetByName: (name: string) =>
    sheets.find((sheet) => sheet.getName() === name) ?? null,
};

const relations: RelationsConfig = {
  Users: {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
    profile: {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    },
  },
  Posts: {
    author: {
      type: "manyToOne",
      to: "Users",
      field: "authorId",
      reference: "id",
    },
  },
  Profiles: {
    user: {
      type: "manyToOne",
      to: "Users",
      field: "userId",
      reference: "id",
    },
  },
};

const isGassmaController = (value: unknown): value is GassmaController =>
  typeof value === "object" &&
  value !== null &&
  "findMany" in value &&
  typeof value.findMany === "function";

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!isGassmaController(controller)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

describe("空オブジェクトフィルタの件数が Prisma 実測と一致する（統合）", () => {
  let client: GassmaClient;

  beforeAll(() => {
    Object.assign(globalThis, {
      SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
    });
    client = new GassmaClient({ relations });
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  describe("to-many（Users.posts）", () => {
    it("posts: {} は全件（3件）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { posts: {} },
      });
      expect(result).toHaveLength(3);
    });

    it("posts: { some: {} } は子を1件以上持つ親（2件）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { posts: { some: {} } },
      });
      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });

    it("posts: { none: {} } は子ゼロの親（1件）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { posts: { none: {} } },
      });
      expect(result).toEqual([{ id: 3, name: "Carol" }]);
    });

    it("posts: { every: {} } は vacuous truth で全件（3件）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { posts: { every: {} } },
      });
      expect(result).toHaveLength(3);
    });
  });

  describe("to-one（Posts.author）", () => {
    it("author: {} は Orphan も含む全件（3件）", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: {} },
      });
      expect(result).toHaveLength(3);
    });

    it("author: { is: {} } は関連が存在する行のみ（2件）", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { author: { is: {} } },
      });
      expect(result).toEqual([
        { id: 11, authorId: 1, title: "Hello" },
        { id: 12, authorId: 2, title: "Spam" },
      ]);
    });
  });

  describe("to-one（Users.profile、FK を持たない側）", () => {
    it("profile: {} は全件（3件）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { profile: {} },
      });
      expect(result).toHaveLength(3);
    });

    it("profile: { is: {} } は関連が存在する行のみ（2件）", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { profile: { is: {} } },
      });
      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });
  });
});
