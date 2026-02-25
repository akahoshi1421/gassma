import { validateColumnExistence } from "../../../../util/relation/validation/validateColumnExistence";

describe("validateColumnExistence", () => {
  const getColumnHeaders = (sheetName: string): string[] => {
    const headers: Record<string, string[]> = {
      Users: ["id", "name", "email"],
      Posts: ["id", "authorId", "title"],
      PostCategories: ["postId", "categoryId"],
      Categories: ["id", "name"],
    };
    return headers[sheetName] ?? [];
  };

  describe("field のカラム存在チェック", () => {
    it("field がソースシートに存在しない場合エラーを投げる", () => {
      const definition = {
        type: "oneToMany",
        to: "Posts",
        field: "nonExistent",
        reference: "authorId",
      };

      expect(() =>
        validateColumnExistence("Users", "posts", definition, getColumnHeaders),
      ).toThrow('Column "nonExistent" is not found in sheet "Users"');
    });

    it("field がソースシートに存在する場合エラーを投げない", () => {
      const definition = {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      };

      expect(() =>
        validateColumnExistence("Users", "posts", definition, getColumnHeaders),
      ).not.toThrow();
    });
  });

  describe("reference のカラム存在チェック", () => {
    it("reference がターゲットシートに存在しない場合エラーを投げる", () => {
      const definition = {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "nonExistent",
      };

      expect(() =>
        validateColumnExistence("Users", "posts", definition, getColumnHeaders),
      ).toThrow('Column "nonExistent" is not found in sheet "Posts"');
    });

    it("reference がターゲットシートに存在する場合エラーを投げない", () => {
      const definition = {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      };

      expect(() =>
        validateColumnExistence("Users", "posts", definition, getColumnHeaders),
      ).not.toThrow();
    });
  });

  describe("manyToMany の through カラム存在チェック", () => {
    it("through.field が中間テーブルに存在しない場合エラーを投げる", () => {
      const definition = {
        type: "manyToMany",
        to: "Categories",
        field: "id",
        reference: "id",
        through: {
          sheet: "PostCategories",
          field: "nonExistent",
          reference: "categoryId",
        },
      };

      expect(() =>
        validateColumnExistence(
          "Posts",
          "categories",
          definition,
          getColumnHeaders,
        ),
      ).toThrow('Column "nonExistent" is not found in sheet "PostCategories"');
    });

    it("through.reference が中間テーブルに存在しない場合エラーを投げる", () => {
      const definition = {
        type: "manyToMany",
        to: "Categories",
        field: "id",
        reference: "id",
        through: {
          sheet: "PostCategories",
          field: "postId",
          reference: "nonExistent",
        },
      };

      expect(() =>
        validateColumnExistence(
          "Posts",
          "categories",
          definition,
          getColumnHeaders,
        ),
      ).toThrow('Column "nonExistent" is not found in sheet "PostCategories"');
    });

    it("through の全カラムが存在する場合エラーを投げない", () => {
      const definition = {
        type: "manyToMany",
        to: "Categories",
        field: "id",
        reference: "id",
        through: {
          sheet: "PostCategories",
          field: "postId",
          reference: "categoryId",
        },
      };

      expect(() =>
        validateColumnExistence(
          "Posts",
          "categories",
          definition,
          getColumnHeaders,
        ),
      ).not.toThrow();
    });
  });
});
