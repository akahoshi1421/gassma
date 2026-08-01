import { RelationIgnoredColumnError } from "../../../../errors/relation/relationValidationError";
import { validateIgnoredColumns } from "../../../../util/relation/validation/validateIgnoredColumns";
import { validateRelationsConfig } from "../../../../util/relation/validation/validateRelationsConfig";

const buildGetIgnoredFields =
  (ignored: Record<string, string[]>) =>
  (sheetName: string): string[] =>
    ignored[sheetName] ?? [];

describe("validateIgnoredColumns", () => {
  const oneToMany = {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
  };

  const manyToMany = {
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

  it("field が自シートで無視されている場合エラーを投げる", () => {
    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        oneToMany,
        buildGetIgnoredFields({ Users: ["id"] }),
      ),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("reference が相手シートで無視されている場合エラーを投げる", () => {
    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        oneToMany,
        buildGetIgnoredFields({ Posts: ["authorId"] }),
      ),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("エラーメッセージにシート・リレーション・列名と危険性が含まれる", () => {
    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        oneToMany,
        buildGetIgnoredFields({ Posts: ["authorId"] }),
      ),
    ).toThrow(
      'Relation "posts" on sheet "Users": column "authorId" is ignored on sheet "Posts". Ignored columns are stripped from where conditions, so relation processing (onDelete/onUpdate/nested writes) could modify all rows in sheet "Posts". Remove "authorId" from the ignore option or remove this relation',
    );
  });

  it("through.field が中間シートで無視されている場合エラーを投げる", () => {
    expect(() =>
      validateIgnoredColumns(
        "Posts",
        "categories",
        manyToMany,
        buildGetIgnoredFields({ PostCategories: ["postId"] }),
      ),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("through.reference が中間シートで無視されている場合エラーを投げる", () => {
    expect(() =>
      validateIgnoredColumns(
        "Posts",
        "categories",
        manyToMany,
        buildGetIgnoredFields({ PostCategories: ["categoryId"] }),
      ),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("manyToMany の reference が相手シートで無視されている場合エラーを投げる", () => {
    expect(() =>
      validateIgnoredColumns(
        "Posts",
        "categories",
        manyToMany,
        buildGetIgnoredFields({ Categories: ["id"] }),
      ),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("リレーションと無関係な列の無視ではエラーを投げない", () => {
    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        oneToMany,
        buildGetIgnoredFields({ Users: ["name"], Posts: ["title"] }),
      ),
    ).not.toThrow();
  });

  it("同名の列でも別シートでの無視ならエラーを投げない", () => {
    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        oneToMany,
        buildGetIgnoredFields({ Users: ["authorId"], Posts: ["id"] }),
      ),
    ).not.toThrow();
  });

  it("through の列名を中間シート以外で無視してもエラーを投げない", () => {
    expect(() =>
      validateIgnoredColumns(
        "Posts",
        "categories",
        manyToMany,
        buildGetIgnoredFields({
          Posts: ["postId"],
          Categories: ["categoryId"],
        }),
      ),
    ).not.toThrow();
  });

  it("無視設定が空ならエラーを投げない", () => {
    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        oneToMany,
        buildGetIgnoredFields({}),
      ),
    ).not.toThrow();
  });

  it("manyToMany 以外では through の検査を行わない", () => {
    const withoutThrough = {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    };

    expect(() =>
      validateIgnoredColumns(
        "Users",
        "posts",
        withoutThrough,
        buildGetIgnoredFields({ PostCategories: ["postId", "categoryId"] }),
      ),
    ).not.toThrow();
  });
});

describe("validateRelationsConfig の無視列チェック連携", () => {
  const mockSheets: Record<string, unknown> = {
    Users: {},
    Posts: {},
  };

  const getColumnHeaders = (sheetName: string): string[] => {
    const headers: Record<string, string[]> = {
      Users: ["id", "name"],
      Posts: ["id", "authorId", "title"],
    };
    return headers[sheetName] ?? [];
  };

  const relations = {
    Users: {
      posts: {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      },
    },
  };

  it("getIgnoredFields 付きで無視列を使うリレーションを弾く", () => {
    expect(() =>
      validateRelationsConfig(
        relations,
        mockSheets,
        getColumnHeaders,
        buildGetIgnoredFields({ Posts: ["authorId"] }),
      ),
    ).toThrow(RelationIgnoredColumnError);
  });

  it("getIgnoredFields 付きでも無関係な列の無視なら通る", () => {
    expect(() =>
      validateRelationsConfig(
        relations,
        mockSheets,
        getColumnHeaders,
        buildGetIgnoredFields({ Posts: ["title"], Users: ["name"] }),
      ),
    ).not.toThrow();
  });
});
