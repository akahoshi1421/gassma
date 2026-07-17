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
      ["id", "authorId", "title"],
      [101, 1, "Post A"],
      [102, 2, "Post B"],
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
    },
    omit: { Users: { password: true } },
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

describe("write系 include + omit 併用時の globalOmit マージ", () => {
  let client: GassmaClient;

  beforeEach(() => {
    client = buildClient();
  });

  afterAll(() => {
    Object.assign(globalThis, { SpreadsheetApp: undefined });
  });

  describe("create", () => {
    it("include + クエリomit(email) で globalOmit(password) もマージされ除外される", () => {
      const result = sheetOf(client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          password: "pw-c",
          email: "c@example.com",
        },
        include: { posts: true },
        omit: { email: true },
      });

      expect(result).toEqual({ id: 3, name: "Carol", posts: [] });
    });

    it("include + omit: { password: false } で password が返る（解除）", () => {
      const result = sheetOf(client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          password: "pw-c",
          email: "c@example.com",
        },
        include: { posts: true },
        omit: { password: false },
      });

      expect(result).toEqual({
        id: 3,
        name: "Carol",
        password: "pw-c",
        email: "c@example.com",
        posts: [],
      });
    });
  });

  describe("createManyAndReturn", () => {
    it("include + クエリomit(email) で globalOmit(password) もマージされ除外される", () => {
      const result = sheetOf(client, "Users").createManyAndReturn({
        data: [
          { id: 3, name: "Carol", password: "pw-c", email: "c@example.com" },
        ],
        include: { posts: true },
        omit: { email: true },
      });

      expect(result).toEqual([{ id: 3, name: "Carol", posts: [] }]);
    });

    it("include + omit: { password: false } で password が返る（解除）", () => {
      const result = sheetOf(client, "Users").createManyAndReturn({
        data: [
          { id: 3, name: "Carol", password: "pw-c", email: "c@example.com" },
        ],
        include: { posts: true },
        omit: { password: false },
      });

      expect(result).toEqual([
        {
          id: 3,
          name: "Carol",
          password: "pw-c",
          email: "c@example.com",
          posts: [],
        },
      ]);
    });
  });

  describe("update", () => {
    it("include + クエリomit(email) で globalOmit(password) もマージされ除外される", () => {
      const result = sheetOf(client, "Users").update({
        where: { id: 1 },
        data: { name: "Alice2" },
        include: { posts: true },
        omit: { email: true },
      });

      expect(result).toEqual({
        id: 1,
        name: "Alice2",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      });
    });

    it("include + omit: { password: false } で password が返る（解除）", () => {
      const result = sheetOf(client, "Users").update({
        where: { id: 1 },
        data: { name: "Alice2" },
        include: { posts: true },
        omit: { password: false },
      });

      expect(result).toEqual({
        id: 1,
        name: "Alice2",
        password: "pw-a",
        email: "a@example.com",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      });
    });
  });

  describe("upsert", () => {
    it("update経路: include のみで globalOmit(password) が適用される", () => {
      const result = sheetOf(client, "Users").upsert({
        where: { id: 1 },
        create: { id: 1, name: "never", password: "x", email: "x" },
        update: { name: "Alice2" },
        include: { posts: true },
      });

      expect(result).toEqual({
        id: 1,
        name: "Alice2",
        email: "a@example.com",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      });
    });

    it("update経路: include + クエリomit(email) で globalOmit もマージされる", () => {
      const result = sheetOf(client, "Users").upsert({
        where: { id: 1 },
        create: { id: 1, name: "never", password: "x", email: "x" },
        update: { name: "Alice2" },
        include: { posts: true },
        omit: { email: true },
      });

      expect(result).toEqual({
        id: 1,
        name: "Alice2",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      });
    });

    it("update経路: include + omit: { password: false } で password が返る（解除）", () => {
      const result = sheetOf(client, "Users").upsert({
        where: { id: 1 },
        create: { id: 1, name: "never", password: "x", email: "x" },
        update: { name: "Alice2" },
        include: { posts: true },
        omit: { password: false },
      });

      expect(result).toEqual({
        id: 1,
        name: "Alice2",
        password: "pw-a",
        email: "a@example.com",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      });
    });

    it("create経路: include + クエリomit(email) で globalOmit もマージされる", () => {
      const result = sheetOf(client, "Users").upsert({
        where: { id: 4 },
        create: {
          id: 4,
          name: "Dave",
          password: "pw-d",
          email: "d@example.com",
        },
        update: { name: "never" },
        include: { posts: true },
        omit: { email: true },
      });

      expect(result).toEqual({ id: 4, name: "Dave", posts: [] });
    });
  });

  describe("delete", () => {
    it("include のみで globalOmit(password) が適用される", () => {
      const result = sheetOf(client, "Users").delete({
        where: { id: 2 },
        include: { posts: true },
      });

      expect(result).toEqual({
        id: 2,
        name: "Bob",
        email: "b@example.com",
        posts: [{ id: 102, authorId: 2, title: "Post B" }],
      });
    });

    it("include + クエリomit(email) で globalOmit もマージされる", () => {
      const result = sheetOf(client, "Users").delete({
        where: { id: 2 },
        include: { posts: true },
        omit: { email: true },
      });

      expect(result).toEqual({
        id: 2,
        name: "Bob",
        posts: [{ id: 102, authorId: 2, title: "Post B" }],
      });
    });

    it("include + omit: { password: false } で password が返る（解除）", () => {
      const result = sheetOf(client, "Users").delete({
        where: { id: 2 },
        include: { posts: true },
        omit: { password: false },
      });

      expect(result).toEqual({
        id: 2,
        name: "Bob",
        password: "pw-b",
        email: "b@example.com",
        posts: [{ id: 102, authorId: 2, title: "Post B" }],
      });
    });
  });

  describe("非回帰", () => {
    it("create: include のみで globalOmit(password) が適用される", () => {
      const result = sheetOf(client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          password: "pw-c",
          email: "c@example.com",
        },
        include: { posts: true },
      });

      expect(result).toEqual({
        id: 3,
        name: "Carol",
        email: "c@example.com",
        posts: [],
      });
    });

    it("create: select 指定時は globalOmit を無視して password を返す", () => {
      const result = sheetOf(client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          password: "pw-c",
          email: "c@example.com",
        },
        select: { name: true, password: true },
      });

      expect(result).toEqual({ name: "Carol", password: "pw-c" });
    });

    it("create: include なし + omit: { password: false } で password が返る", () => {
      const result = sheetOf(client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          password: "pw-c",
          email: "c@example.com",
        },
        omit: { password: false },
      });

      expect(result).toEqual({
        id: 3,
        name: "Carol",
        password: "pw-c",
        email: "c@example.com",
      });
    });

    it("findMany: include + omit: { password: false } で password が返る", () => {
      const result = sheetOf(client, "Users").findMany({
        where: { id: 1 },
        include: { posts: true },
        omit: { password: false },
      });

      expect(result).toEqual([
        {
          id: 1,
          name: "Alice",
          password: "pw-a",
          email: "a@example.com",
          posts: [{ id: 101, authorId: 1, title: "Post A" }],
        },
      ]);
    });
  });
});
