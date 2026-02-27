import { validateRelationDefinition } from "../../../../util/relation/validation/validateRelationDefinition";

describe("validateRelationDefinition", () => {
  const sheetName = "Users";
  const allSheetNames = ["Users", "Posts", "Profiles", "PostCategories"];

  describe("必須プロパティの存在チェック", () => {
    it.each(["type", "to", "field", "reference"])(
      "%s が未定義の場合エラーを投げる",
      (prop) => {
        const definition: Record<string, unknown> = {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
        };
        delete definition[prop];

        expect(() =>
          validateRelationDefinition(
            sheetName,
            "posts",
            definition,
            allSheetNames,
          ),
        ).toThrow(`is missing required property "${prop}"`);
      },
    );
  });

  describe("プロパティの型チェック", () => {
    it.each(["type", "to", "field", "reference"])(
      "%s が string でない場合エラーを投げる",
      (prop) => {
        const definition: Record<string, unknown> = {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
        };
        definition[prop] = 123;

        expect(() =>
          validateRelationDefinition(
            sheetName,
            "posts",
            definition,
            allSheetNames,
          ),
        ).toThrow(`property "${prop}" must be a string`);
      },
    );
  });

  describe("type の値チェック", () => {
    it("無効な type 値の場合エラーを投げる", () => {
      const definition = {
        type: "invalidType",
        to: "Posts",
        field: "id",
        reference: "authorId",
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "posts",
          definition,
          allSheetNames,
        ),
      ).toThrow('type "invalidType" is not valid');
    });

    it.each(["oneToMany", "oneToOne", "manyToOne", "manyToMany"])(
      "type=%s は有効",
      (type) => {
        const definition: Record<string, unknown> = {
          type,
          to: "Posts",
          field: "id",
          reference: "authorId",
        };
        if (type === "manyToMany") {
          definition.through = {
            sheet: "PostCategories",
            field: "userId",
            reference: "postId",
          };
        }

        expect(() =>
          validateRelationDefinition(
            sheetName,
            "posts",
            definition,
            allSheetNames,
          ),
        ).not.toThrow();
      },
    );
  });

  describe("relation.to のシート存在チェック", () => {
    it("存在しないシートの場合エラーを投げる", () => {
      const definition = {
        type: "oneToMany",
        to: "NonExistent",
        field: "id",
        reference: "authorId",
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "posts",
          definition,
          allSheetNames,
        ),
      ).toThrow('Sheet "NonExistent" is not found');
    });
  });

  describe("manyToMany の through チェック", () => {
    it("manyToMany で through が未定義の場合エラーを投げる", () => {
      const definition = {
        type: "manyToMany",
        to: "Posts",
        field: "id",
        reference: "id",
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "categories",
          definition,
          allSheetNames,
        ),
      ).toThrow('is missing required property "through"');
    });

    it.each(["sheet", "field", "reference"])(
      "through.%s が未定義の場合エラーを投げる",
      (prop) => {
        const through: Record<string, unknown> = {
          sheet: "PostCategories",
          field: "userId",
          reference: "postId",
        };
        delete through[prop];

        const definition = {
          type: "manyToMany",
          to: "Posts",
          field: "id",
          reference: "id",
          through,
        };

        expect(() =>
          validateRelationDefinition(
            sheetName,
            "categories",
            definition,
            allSheetNames,
          ),
        ).toThrow(`is missing required property "through.${prop}"`);
      },
    );

    it.each(["sheet", "field", "reference"])(
      "through.%s が string でない場合エラーを投げる",
      (prop) => {
        const through: Record<string, unknown> = {
          sheet: "PostCategories",
          field: "userId",
          reference: "postId",
        };
        through[prop] = 123;

        const definition = {
          type: "manyToMany",
          to: "Posts",
          field: "id",
          reference: "id",
          through,
        };

        expect(() =>
          validateRelationDefinition(
            sheetName,
            "categories",
            definition,
            allSheetNames,
          ),
        ).toThrow(`property "through.${prop}" must be a string`);
      },
    );

    it("through.sheet が存在しないシートの場合エラーを投げる", () => {
      const definition = {
        type: "manyToMany",
        to: "Posts",
        field: "id",
        reference: "id",
        through: {
          sheet: "NonExistent",
          field: "userId",
          reference: "postId",
        },
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "categories",
          definition,
          allSheetNames,
        ),
      ).toThrow('Sheet "NonExistent" is not found');
    });
  });

  describe("onDelete の値チェック", () => {
    it.each(["Cascade", "SetNull", "Restrict", "NoAction"])(
      "onDelete=%s は有効",
      (onDelete) => {
        const definition = {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
          onDelete,
        };

        expect(() =>
          validateRelationDefinition(
            sheetName,
            "posts",
            definition,
            allSheetNames,
          ),
        ).not.toThrow();
      },
    );

    it("無効な onDelete 値の場合エラーを投げる", () => {
      const definition = {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
        onDelete: "InvalidAction",
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "posts",
          definition,
          allSheetNames,
        ),
      ).toThrow("InvalidAction");
    });
  });

  describe("正常系", () => {
    it("有効な oneToMany 定義でエラーを投げない", () => {
      const definition = {
        type: "oneToMany",
        to: "Posts",
        field: "id",
        reference: "authorId",
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "posts",
          definition,
          allSheetNames,
        ),
      ).not.toThrow();
    });

    it("有効な manyToMany 定義でエラーを投げない", () => {
      const definition = {
        type: "manyToMany",
        to: "Posts",
        field: "id",
        reference: "id",
        through: {
          sheet: "PostCategories",
          field: "userId",
          reference: "postId",
        },
      };

      expect(() =>
        validateRelationDefinition(
          sheetName,
          "categories",
          definition,
          allSheetNames,
        ),
      ).not.toThrow();
    });
  });
});
