import {
  extractRelationData,
  isNestedWriteOperation,
} from "../../../../util/create/nestedWrite/extractRelationData";
import type { RelationDefinition } from "../../../../types/relationTypes";

describe("extractRelationData", () => {
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
    const data = { id: 1, name: "田中" };
    const result = extractRelationData(data, relations);

    expect(result.scalarData).toEqual({ id: 1, name: "田中" });
    expect(result.relationOps.size).toBe(0);
  });

  it("create を含むリレーションフィールドが正しく分離される", () => {
    const data = {
      id: 1,
      name: "田中",
      posts: { create: [{ title: "記事A" }] },
    };
    const result = extractRelationData(data, relations);

    expect(result.scalarData).toEqual({ id: 1, name: "田中" });
    expect(result.relationOps.size).toBe(1);
    expect(result.relationOps.get("posts")).toEqual({
      create: [{ title: "記事A" }],
    });
  });

  it("connect を含むリレーションフィールドが正しく分離される", () => {
    const data = {
      title: "記事A",
      author: { connect: { id: 1 } },
    };
    const result = extractRelationData(data, relations);

    expect(result.scalarData).toEqual({ title: "記事A" });
    expect(result.relationOps.get("author")).toEqual({
      connect: { id: 1 },
    });
  });

  it("connectOrCreate を含むリレーションフィールドが正しく分離される", () => {
    const data = {
      title: "記事A",
      author: {
        connectOrCreate: {
          where: { name: "田中" },
          create: { id: 1, name: "田中" },
        },
      },
    };
    const result = extractRelationData(data, relations);

    expect(result.scalarData).toEqual({ title: "記事A" });
    expect(result.relationOps.get("author")).toEqual({
      connectOrCreate: {
        where: { name: "田中" },
        create: { id: 1, name: "田中" },
      },
    });
  });

  it("スカラーとリレーションの混在を両方正しく分離する", () => {
    const data = {
      id: 1,
      name: "田中",
      posts: { create: [{ title: "記事A" }] },
      author: { connect: { id: 2 } },
    };
    const result = extractRelationData(data, relations);

    expect(result.scalarData).toEqual({ id: 1, name: "田中" });
    expect(result.relationOps.size).toBe(2);
  });
});

describe("isNestedWriteOperation", () => {
  it("create キーを持つオブジェクトは true", () => {
    expect(isNestedWriteOperation({ create: { title: "A" } })).toBe(true);
  });

  it("connect キーを持つオブジェクトは true", () => {
    expect(isNestedWriteOperation({ connect: { id: 1 } })).toBe(true);
  });

  it("connectOrCreate キーを持つオブジェクトは true", () => {
    expect(
      isNestedWriteOperation({
        connectOrCreate: { where: {}, create: {} },
      }),
    ).toBe(true);
  });

  it("createMany キーを持つオブジェクトは true", () => {
    expect(isNestedWriteOperation({ createMany: { data: [] } })).toBe(true);
  });

  it("関係ないキーのみのオブジェクトは false", () => {
    expect(isNestedWriteOperation({ title: "A" })).toBe(false);
  });

  it("プリミティブ値は false", () => {
    expect(isNestedWriteOperation("hello")).toBe(false);
    expect(isNestedWriteOperation(123)).toBe(false);
    expect(isNestedWriteOperation(null)).toBe(false);
  });
});
