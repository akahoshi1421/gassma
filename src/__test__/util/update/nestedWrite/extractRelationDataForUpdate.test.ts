import {
  extractRelationDataForUpdate,
  isUpdateNestedWriteOperation,
} from "../../../../util/update/nestedWrite/extractRelationDataForUpdate";
import type { RelationDefinition } from "../../../../types/relationTypes";

describe("extractRelationDataForUpdate", () => {
  const relations: Record<string, RelationDefinition> = {
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
  };

  it("スカラーフィールドのみの場合 relationOps が空になる", () => {
    const data = { name: "田中更新" };
    const result = extractRelationDataForUpdate(data, relations);

    expect(result.scalarData).toEqual({ name: "田中更新" });
    expect(result.relationOps.size).toBe(0);
  });

  it("update キーを含むデータが relation ops に分離される", () => {
    const data = {
      name: "田中更新",
      posts: { update: { where: { id: 1 }, data: { title: "新タイトル" } } },
    };
    const result = extractRelationDataForUpdate(data, relations);

    expect(result.scalarData).toEqual({ name: "田中更新" });
    expect(result.relationOps.size).toBe(1);
    expect(result.relationOps.get("posts")).toEqual({
      update: { where: { id: 1 }, data: { title: "新タイトル" } },
    });
  });

  it("delete/deleteMany キーも分離される", () => {
    const data = {
      name: "田中更新",
      posts: { deleteMany: { published: false } },
    };
    const result = extractRelationDataForUpdate(data, relations);

    expect(result.scalarData).toEqual({ name: "田中更新" });
    expect(result.relationOps.get("posts")).toEqual({
      deleteMany: { published: false },
    });
  });

  it("create + update の混在が正しく分離される", () => {
    const data = {
      name: "田中更新",
      author: { connect: { id: 1 } },
      posts: { update: { where: { id: 5 }, data: { title: "変更" } } },
    };
    const result = extractRelationDataForUpdate(data, relations);

    expect(result.scalarData).toEqual({ name: "田中更新" });
    expect(result.relationOps.size).toBe(2);
    expect(result.relationOps.get("author")).toEqual({
      connect: { id: 1 },
    });
    expect(result.relationOps.get("posts")).toEqual({
      update: { where: { id: 5 }, data: { title: "変更" } },
    });
  });
});

describe("isUpdateNestedWriteOperation", () => {
  it("update キーを持つオブジェクトは true", () => {
    expect(isUpdateNestedWriteOperation({ update: { name: "A" } })).toBe(true);
  });

  it("delete キーを持つオブジェクトは true", () => {
    expect(isUpdateNestedWriteOperation({ delete: true })).toBe(true);
  });

  it("deleteMany キーを持つオブジェクトは true", () => {
    expect(
      isUpdateNestedWriteOperation({ deleteMany: { published: false } }),
    ).toBe(true);
  });

  it("create キーを持つオブジェクトは true", () => {
    expect(isUpdateNestedWriteOperation({ create: { title: "A" } })).toBe(true);
  });

  it("関係ないキーのみのオブジェクトは false", () => {
    expect(isUpdateNestedWriteOperation({ title: "A" })).toBe(false);
  });

  it("プリミティブ値は false", () => {
    expect(isUpdateNestedWriteOperation("hello")).toBe(false);
    expect(isUpdateNestedWriteOperation(123)).toBe(false);
    expect(isUpdateNestedWriteOperation(null)).toBe(false);
  });
});
