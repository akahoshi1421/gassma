import { resolveNestedUpdate } from "../../../../util/update/nestedWrite/resolveNestedUpdate";
import type {
  RelationDefinition,
  RelationContext,
} from "../../../../types/relationTypes";
import type { GassmaControllerUtil } from "../../../../types/gassmaControllerUtilType";

describe("resolveNestedUpdate", () => {
  const mockFindMany = jest.fn();
  const mockCreateOnSheet = jest.fn();
  const mockCreateManyOnSheet = jest.fn();
  const mockUpdateManyOnSheet = jest.fn();
  const mockDeleteManyOnSheet = jest.fn();

  const makeContext = (
    relations: Record<string, RelationDefinition>,
  ): RelationContext => ({
    relations,
    findManyOnSheet: mockFindMany,
    createOnSheet: mockCreateOnSheet,
    createManyOnSheet: mockCreateManyOnSheet,
    updateManyOnSheet: mockUpdateManyOnSheet,
    deleteManyOnSheet: mockDeleteManyOnSheet,
  });

  let mockSheet: Record<string, jest.Mock>;

  beforeEach(() => {
    mockFindMany.mockReset();
    mockCreateOnSheet.mockReset();
    mockCreateManyOnSheet.mockReset();
    mockUpdateManyOnSheet.mockReset();
    mockDeleteManyOnSheet.mockReset();
  });

  const manyToOneRelation: RelationDefinition = {
    type: "manyToOne",
    to: "Users",
    field: "authorId",
    reference: "id",
  };

  const oneToManyRelation: RelationDefinition = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

  let setValuesMock: jest.Mock;

  const setupSheet = (
    headers: string[],
    rows: unknown[][],
  ): GassmaControllerUtil => {
    setValuesMock = jest.fn();
    let dataReturned = false;

    mockSheet = {
      getRange: jest
        .fn()
        .mockImplementation((row: number, _col: number, numRows: number) => {
          if (row === 1 && numRows === 1) {
            return { getValues: jest.fn().mockReturnValue([headers]) };
          }
          if (!dataReturned && row > 1) {
            dataReturned = true;
            return { getValues: jest.fn().mockReturnValue(rows) };
          }
          return { setValues: setValuesMock };
        }),
      getLastRow: jest.fn().mockReturnValue(rows.length + 1),
    };

    return {
      sheet: mockSheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: headers.length,
    };
  };

  it("マッチなしで null を返す", () => {
    const util = setupSheet(["id", "title", "authorId"], []);

    const result = resolveNestedUpdate(
      util,
      { where: { id: 999 }, data: { title: "変更" } },
      undefined,
    );

    expect(result).toBeNull();
  });

  it("ネストなし: スカラー更新 + レコード返却", () => {
    const util = setupSheet(
      ["id", "title", "authorId"],
      [
        [1, "記事A", 1],
        [2, "記事B", 2],
      ],
    );

    const result = resolveNestedUpdate(
      util,
      { where: { id: 1 }, data: { title: "変更後" } },
      undefined,
    );

    expect(result).toEqual({ id: 1, title: "変更後", authorId: 1 });
    expect(setValuesMock).toHaveBeenCalledWith([[1, "変更後", 1]]);
  });

  it("manyToOne + connect の統合テスト", () => {
    const util = setupSheet(["id", "title", "authorId"], [[1, "記事A", 1]]);
    mockFindMany.mockReturnValue([{ id: 5, name: "佐藤" }]);

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: { author: { connect: { id: 5 } } },
      },
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ id: 1, title: "記事A", authorId: 5 });
    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: 5 },
    });
  });

  it("manyToOne + update の統合テスト", () => {
    const util = setupSheet(["id", "title", "authorId"], [[1, "記事A", 1]]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: { title: "変更後", author: { update: { name: "佐藤" } } },
      },
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ id: 1, title: "変更後", authorId: 1 });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Users", {
      where: { id: 1 },
      data: { name: "佐藤" },
    });
  });

  it("manyToOne + delete の統合テスト", () => {
    const util = setupSheet(["id", "title", "authorId"], [[1, "記事A", 1]]);
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: { author: { delete: true } },
      },
      makeContext({ author: manyToOneRelation }),
    );

    expect(result).toEqual({ id: 1, title: "記事A", authorId: null });
    expect(mockDeleteManyOnSheet).toHaveBeenCalledWith("Users", {
      where: { id: 1 },
    });
  });

  it("oneToMany + create の統合テスト（processAfterCreate 再利用）", () => {
    const util = setupSheet(["id", "name"], [[1, "田中"]]);

    mockCreateOnSheet.mockReturnValue({
      id: 10,
      title: "記事A",
      authorId: 1,
    });

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: { posts: { create: { title: "記事A" } } },
      },
      makeContext({ posts: oneToManyRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockCreateOnSheet).toHaveBeenCalledWith("Posts", {
      data: { title: "記事A", authorId: 1 },
    });
  });

  it("oneToMany + update の統合テスト", () => {
    const util = setupSheet(["id", "name"], [[1, "田中"]]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: {
          posts: {
            update: { where: { id: 5 }, data: { title: "新タイトル" } },
          },
        },
      },
      makeContext({ posts: oneToManyRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 5, authorId: 1 },
      data: { title: "新タイトル" },
    });
  });

  it("oneToMany + delete/deleteMany の統合テスト", () => {
    const util = setupSheet(["id", "name"], [[1, "田中"]]);
    mockDeleteManyOnSheet.mockReturnValue({ count: 1 });

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: {
          posts: {
            delete: { id: 5 },
            deleteMany: { published: false },
          },
        },
      },
      makeContext({ posts: oneToManyRelation }),
    );

    expect(result).toEqual({ id: 1, name: "田中" });
    expect(mockDeleteManyOnSheet).toHaveBeenCalledTimes(2);
  });

  it("RelationContext なしで nested write → エラー", () => {
    const util = setupSheet(["id", "title", "authorId"], [[1, "記事A", 1]]);

    expect(() =>
      resolveNestedUpdate(
        util,
        {
          where: { id: 1 },
          data: { author: { connect: { id: 5 } } },
        },
        undefined,
      ),
    ).toThrow("Cannot use nested write");
  });

  it("manyToOne + oneToMany 同時処理", () => {
    const util = setupSheet(["id", "title", "authorId"], [[1, "記事A", 1]]);
    mockFindMany.mockReturnValue([{ id: 5, name: "佐藤" }]);
    mockUpdateManyOnSheet.mockReturnValue({ count: 1 });

    const commentsRelation: RelationDefinition = {
      type: "oneToMany",
      to: "Comments",
      field: "id",
      reference: "postId",
    };

    const result = resolveNestedUpdate(
      util,
      {
        where: { id: 1 },
        data: {
          author: { connect: { id: 5 } },
          comments: {
            update: { where: { id: 10 }, data: { content: "変更" } },
          },
        },
      },
      makeContext({
        author: manyToOneRelation,
        comments: commentsRelation,
      }),
    );

    expect(result).toEqual({ id: 1, title: "記事A", authorId: 5 });
    expect(mockFindMany).toHaveBeenCalledWith("Users", {
      where: { id: 5 },
    });
    expect(mockUpdateManyOnSheet).toHaveBeenCalledWith("Comments", {
      where: { id: 10, postId: 1 },
      data: { content: "変更" },
    });
  });
});
