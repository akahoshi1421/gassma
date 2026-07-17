import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import type { RelationsConfig } from "../../../types/relationTypes";

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
  ]),
  makeSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Post A"],
    [102, 1, "Post B"],
    [103, 2, "Post C"],
  ]),
  makeSheet("Comments", [
    ["id", "postId", "body"],
    [201, 101, "Nice"],
    [202, 101, "Great"],
    [203, 103, "Hmm"],
  ]),
  makeSheet("Profiles", [
    ["id", "userId", "bio"],
    [301, 1, "Alice bio"],
    [302, 2, "Bob bio"],
  ]),
  makeSheet("Categories", [
    ["id", "name"],
    [401, "Tech"],
    [402, "Life"],
  ]),
  makeSheet("PostCategories", [
    ["postId", "categoryId"],
    [101, 401],
    [101, 402],
    [103, 401],
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
    comments: {
      type: "oneToMany",
      to: "Comments",
      field: "id",
      reference: "postId",
    },
    categories: {
      type: "manyToMany",
      to: "Categories",
      field: "id",
      reference: "id",
      through: {
        sheet: "PostCategories",
        field: "postId",
        reference: "categoryId",
      },
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
  Categories: {
    posts: {
      type: "manyToMany",
      to: "Posts",
      field: "id",
      reference: "id",
      through: {
        sheet: "PostCategories",
        field: "categoryId",
        reference: "postId",
      },
    },
  },
};

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!(controller instanceof GassmaController)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

describe("nested select の true 形式 relation 解決（統合）", () => {
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

  describe("manyToOne 内の true 形式", () => {
    it("select: { author: { select: { posts: true } } } が posts を解決する", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { id: 101 },
        select: {
          title: true,
          author: { select: { name: true, posts: true } },
        },
      });

      expect(result).toEqual([
        {
          title: "Post A",
          author: {
            name: "Alice",
            posts: [
              { id: 101, authorId: 1, title: "Post A" },
              { id: 102, authorId: 1, title: "Post B" },
            ],
          },
        },
      ]);
    });

    it("findFirst でも対称に解決される", () => {
      const result = sheetOf(client, "Posts").findFirst({
        where: { id: 101 },
        select: { author: { select: { posts: true } } },
      });

      expect(result).toEqual({
        author: {
          posts: [
            { id: 101, authorId: 1, title: "Post A" },
            { id: 102, authorId: 1, title: "Post B" },
          ],
        },
      });
    });
  });

  describe("oneToMany 内の true 形式", () => {
    it("select: { posts: { select: { comments: true } } } が comments を解決する", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: { posts: { select: { title: true, comments: true } } },
      });

      expect(result).toEqual([
        {
          posts: [
            {
              title: "Post A",
              comments: [
                { id: 201, postId: 101, body: "Nice" },
                { id: 202, postId: 101, body: "Great" },
              ],
            },
            { title: "Post B", comments: [] },
          ],
        },
      ]);
    });

    it("where/orderBy/skip/take と nested true を併用できる", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: {
          posts: {
            where: { id: { lt: 103 } },
            orderBy: { id: "desc" },
            skip: 1,
            take: 1,
            select: { id: true, comments: true },
          },
        },
      });

      expect(result).toEqual([
        {
          posts: [
            {
              id: 101,
              comments: [
                { id: 201, postId: 101, body: "Nice" },
                { id: 202, postId: 101, body: "Great" },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe("oneToOne 内の true 形式", () => {
    it("select: { profile: { select: { user: true } } } が user を解決する", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: { profile: { select: { bio: true, user: true } } },
      });

      expect(result).toEqual([
        {
          profile: {
            bio: "Alice bio",
            user: { id: 1, name: "Alice" },
          },
        },
      ]);
    });
  });

  describe("manyToMany 内の true 形式", () => {
    it("select: { categories: { select: { posts: true } } } が posts を解決する", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { id: 101 },
        select: { categories: { select: { name: true, posts: true } } },
      });

      expect(result).toEqual([
        {
          categories: [
            {
              name: "Tech",
              posts: [
                { id: 101, authorId: 1, title: "Post A" },
                { id: 103, authorId: 2, title: "Post C" },
              ],
            },
            {
              name: "Life",
              posts: [{ id: 101, authorId: 1, title: "Post A" }],
            },
          ],
        },
      ]);
    });
  });

  describe("object 形式の非回帰", () => {
    it("object 形式の深いネスト select は引き続き解決される", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { id: 101 },
        select: {
          author: { select: { posts: { select: { title: true } } } },
        } as any,
      });

      expect(result).toEqual([
        {
          author: {
            posts: [{ title: "Post A" }, { title: "Post B" }],
          },
        },
      ]);
    });

    it("object 形式の内側の true 形式（3階層）も解決される", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { id: 103 },
        select: {
          author: { select: { posts: { select: { comments: true } } } },
        } as any,
      });

      expect(result).toEqual([
        {
          author: {
            posts: [{ comments: [{ id: 203, postId: 103, body: "Hmm" }] }],
          },
        },
      ]);
    });

    it("非 relation キーの true は scalar として扱われる", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: { posts: { select: { title: true } } },
      });

      expect(result).toEqual([
        { posts: [{ title: "Post A" }, { title: "Post B" }] },
      ]);
    });
  });

  describe("既存仕様の維持", () => {
    it("nested select + include の併用はエラーになる", () => {
      expect(() =>
        sheetOf(client, "Users").findMany({
          select: {
            posts: { select: { title: true }, include: { comments: true } },
          },
        }),
      ).toThrow(
        'Include "posts": cannot use both select and include at the same time',
      );
    });

    it("nested omit は引き続き適用される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 2 },
        select: { posts: { omit: { authorId: true } } },
      });

      expect(result).toEqual([{ posts: [{ id: 103, title: "Post C" }] }]);
    });

    it("トップレベル select の true 形式 relation は従来どおり解決される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 2 },
        select: { name: true, posts: true },
      });

      expect(result).toEqual([
        {
          name: "Bob",
          posts: [{ id: 103, authorId: 2, title: "Post C" }],
        },
      ]);
    });
  });
});
