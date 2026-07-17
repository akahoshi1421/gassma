import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";

type MockRange = {
  getValues: () => unknown[][];
  setValues: (values: unknown[][]) => void;
};

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => MockRange;
  getDataRange: () => { getValues: () => unknown[][] };
  deleteRow: (rowIndex: number) => void;
};

const makeSheet = (name: string, initial: unknown[][]): MockSheet => {
  const data = initial.map((row) => [...row]);
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
    getRange: (row, col, numRows, numCols) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values) => {
        values.forEach((rowValues, i) => {
          while (data.length < row + i) {
            data.push(Array(data[0].length).fill(""));
          }
          rowValues.forEach((value, j) => {
            data[row - 1 + i][col - 1 + j] = value;
          });
        });
      },
    }),
    getDataRange: () => ({ getValues: () => data }),
    deleteRow: (rowIndex) => {
      data.splice(rowIndex - 1, 1);
    },
  };
};

const buildClient = (): GassmaClient => {
  const sheets = [
    makeSheet("Users", [
      ["id", "name", "password", "email"],
      [1, "Alice", "pw-a", "a@example.com"],
      [2, "Bob", "pw-b", "b@example.com"],
    ]),
    makeSheet("Posts", [
      ["id", "authorId", "title", "secret"],
      [101, 1, "Post A", "s-a"],
      [102, 2, "Post B", "s-b"],
    ]),
    makeSheet("Comments", [
      ["id", "postId", "body", "hidden"],
      [1001, 101, "Comment 1", "h-1"],
      [1002, 102, "Comment 2", "h-2"],
    ]),
  ];
  const mockSpreadsheet = {
    getId: () => "test-spreadsheet",
    getSheets: () => sheets,
    getSheetByName: (name: string) =>
      sheets.find((sheet) => sheet.getName() === name) ?? null,
  };
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
  });
  return new GassmaClient({
    relations: {
      Users: {
        posts: {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
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
      },
    },
    omit: {
      Users: { password: true },
      Posts: { secret: true },
      Comments: { hidden: true },
    },
  });
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

describe("nested include/select の relation レベル omit と globalOmit", () => {
  let client: GassmaClient;

  beforeEach(() => {
    client = buildClient();
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  describe("false 解除", () => {
    it("include: { posts: { omit: { secret: false } } } で globalOmit(secret) が解除される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { omit: { secret: false } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ id: 101, authorId: 1, title: "Post A", secret: "s-a" }],
        },
      ]);
    });

    it("manyToOne: include: { author: { omit: { password: false } } } で password が返る", () => {
      const result = sheetOf(client, "Posts").findMany({
        where: { id: 101 },
        include: { author: { omit: { password: false } } },
      });

      expect(result).toEqual([
        {
          id: 101,
          authorId: 1,
          title: "Post A",
          author: {
            id: 1,
            name: "Alice",
            password: "pw-a",
            email: "a@example.com",
          },
        },
      ]);
    });

    it("select 内 relation の omit: { secret: false } でも解除される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        select: { name: true, posts: { omit: { secret: false } } },
      });

      expect(result).toEqual([
        {
          name: "Alice",
          posts: [{ id: 101, authorId: 1, title: "Post A", secret: "s-a" }],
        },
      ]);
    });

    it("深いネスト: comments の omit: { hidden: false } でも解除される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: {
          posts: { include: { comments: { omit: { hidden: false } } } },
        },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [
            {
              id: 101,
              authorId: 1,
              title: "Post A",
              comments: [
                { id: 1001, postId: 101, body: "Comment 1", hidden: "h-1" },
              ],
            },
          ],
        },
      ]);
    });

    it("findFirst でも include: { posts: { omit: { secret: false } } } が解除される", () => {
      const result = sheetOf(client, "Users").findFirst({
        where: { id: 1 },
        include: { posts: { omit: { secret: false } } },
      });

      expect(result).toEqual({
        id: 1,
        name: "Alice",
        email: "a@example.com",
        posts: [{ id: 101, authorId: 1, title: "Post A", secret: "s-a" }],
      });
    });
  });

  describe("globalOmit とのマージ", () => {
    it("omit: { title: true } は globalOmit(secret) とマージされ両方除外される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { omit: { title: true } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ id: 101, authorId: 1 }],
        },
      ]);
    });

    it("omit: { secret: false, title: true } 混在で secret 再表示 + title 除外", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { omit: { secret: false, title: true } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ id: 101, authorId: 1, secret: "s-a" }],
        },
      ]);
    });

    it("globalOmit に無いフィールドの omit: { title: false } は no-op", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { omit: { title: false } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ id: 101, authorId: 1, title: "Post A" }],
        },
      ]);
    });
  });

  describe("非回帰", () => {
    it("include: { posts: true } では globalOmit(secret) が適用される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: true },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ id: 101, authorId: 1, title: "Post A" }],
        },
      ]);
    });

    it("omit: { authorId: true }（グルーピング列の除外）でも紐付けが保たれる", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { omit: { authorId: true } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ id: 101, title: "Post A" }],
        },
      ]);
    });

    it("omit: { id: true } + 深いネスト include でも子孫の紐付けが保たれる", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { omit: { id: true }, include: { comments: true } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [
            {
              authorId: 1,
              title: "Post A",
              comments: [{ id: 1001, postId: 101, body: "Comment 1" }],
            },
          ],
        },
      ]);
    });

    it("include: { posts: { select: { title: true } } } は従来通り select が適用される", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: { select: { title: true } } },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          email: "a@example.com",
          posts: [{ title: "Post A" }],
        },
      ]);
    });
  });
});
