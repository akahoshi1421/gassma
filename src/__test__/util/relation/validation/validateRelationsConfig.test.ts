import { validateRelationsConfig } from "../../../../util/relation/validation/validateRelationsConfig";

describe("validateRelationsConfig", () => {
  const mockSheets: Record<string, unknown> = {
    Users: {},
    Posts: {},
    Profiles: {},
    Categories: {},
    PostCategories: {},
  };

  const getColumnHeaders = (sheetName: string): string[] => {
    const headers: Record<string, string[]> = {
      Users: ["id", "name", "email"],
      Posts: ["id", "authorId", "title"],
      Profiles: ["id", "userId", "bio"],
      Categories: ["id", "name"],
      PostCategories: ["postId", "categoryId"],
    };
    return headers[sheetName] ?? [];
  };

  it("relations のシートが存在しない場合エラーを投げる", () => {
    const relations = {
      NonExistent: {
        posts: {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
        },
      },
    };

    expect(() =>
      validateRelationsConfig(relations, mockSheets, getColumnHeaders),
    ).toThrow('Sheet "NonExistent" is not found');
  });

  it("definition が不正な場合エラーを投げる（validateRelationDefinition委譲）", () => {
    const relations = {
      Users: {
        posts: {
          type: "invalidType",
          to: "Posts",
          field: "id",
          reference: "authorId",
        },
      },
    };

    expect(() =>
      validateRelationsConfig(relations, mockSheets, getColumnHeaders),
    ).toThrow('type "invalidType" is not valid');
  });

  it("カラムが存在しない場合エラーを投げる（validateColumnExistence委譲）", () => {
    const relations = {
      Users: {
        posts: {
          type: "oneToMany",
          to: "Posts",
          field: "nonExistent",
          reference: "authorId",
        },
      },
    };

    expect(() =>
      validateRelationsConfig(relations, mockSheets, getColumnHeaders),
    ).toThrow('Column "nonExistent" is not found in sheet "Users"');
  });

  it("有効な設定の場合エラーを投げない", () => {
    const relations = {
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
    };

    expect(() =>
      validateRelationsConfig(relations, mockSheets, getColumnHeaders),
    ).not.toThrow();
  });

  it("manyToMany を含む有効な設定でエラーを投げない", () => {
    const relations = {
      Posts: {
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
    };

    expect(() =>
      validateRelationsConfig(relations, mockSheets, getColumnHeaders),
    ).not.toThrow();
  });

  it("複数シートに跨がるバリデーションが全て通る", () => {
    const relations = {
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
    };

    expect(() =>
      validateRelationsConfig(relations, mockSheets, getColumnHeaders),
    ).not.toThrow();
  });
});
