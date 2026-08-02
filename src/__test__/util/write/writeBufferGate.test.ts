import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import { raw } from "../../../util/raw/raw";
import {
  shouldBufferCreate,
  shouldBufferDelete,
  shouldBufferUpdate,
  shouldBufferUpdateMany,
  shouldBufferUpsert,
} from "../../../util/write/writeBufferGate";

const contextOf = (
  relations: Record<string, RelationDefinition>,
): RelationContext => ({
  relations,
  findManyOnSheet: () => [],
});

const postsOneToMany = (
  extra?: Partial<RelationDefinition>,
): Record<string, RelationDefinition> => ({
  posts: {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
    ...extra,
  },
});

describe("shouldBufferCreate", () => {
  it("relationContext が無ければ false", () => {
    expect(shouldBufferCreate(null, { posts: { create: [] } })).toBe(false);
  });

  it("nested write が無ければ false", () => {
    const context = contextOf(postsOneToMany());
    expect(shouldBufferCreate(context, { id: 1, name: "A" })).toBe(false);
  });

  it("relation 名のキーが nested write オブジェクトなら true", () => {
    const context = contextOf(postsOneToMany());
    expect(
      shouldBufferCreate(context, { id: 1, posts: { create: [{ id: 2 }] } }),
    ).toBe(true);
  });

  it("relation 名でも値がスカラーなら false", () => {
    const context = contextOf(postsOneToMany());
    expect(shouldBufferCreate(context, { id: 1, posts: 5 })).toBe(false);
  });

  it("relation 名でも値が Date / raw なら false", () => {
    const context = contextOf(postsOneToMany());
    expect(shouldBufferCreate(context, { posts: new Date() })).toBe(false);
    expect(shouldBufferCreate(context, { posts: raw("x") })).toBe(false);
  });

  it("data が undefined なら false", () => {
    const context = contextOf(postsOneToMany());
    expect(shouldBufferCreate(context, undefined)).toBe(false);
  });
});

describe("shouldBufferUpdate", () => {
  it("nested write があれば true", () => {
    const context = contextOf(postsOneToMany());
    expect(
      shouldBufferUpdate(context, { posts: { connect: [{ id: 1 }] } }),
    ).toBe(true);
  });

  it("cascade も nested write も無ければ false", () => {
    const context = contextOf(postsOneToMany());
    expect(shouldBufferUpdate(context, { id: 9, name: "B" })).toBe(false);
  });

  it("onUpdate Cascade の field に触れる data なら true", () => {
    const context = contextOf(postsOneToMany({ onUpdate: "Cascade" }));
    expect(shouldBufferUpdate(context, { id: 9 })).toBe(true);
  });

  it("onUpdate Cascade でも field に触れない data なら false", () => {
    const context = contextOf(postsOneToMany({ onUpdate: "Cascade" }));
    expect(shouldBufferUpdate(context, { name: "B" })).toBe(false);
  });

  it("onUpdate SetNull の field に触れる data なら true", () => {
    const context = contextOf(postsOneToMany({ onUpdate: "SetNull" }));
    expect(shouldBufferUpdate(context, { id: 9 })).toBe(true);
  });

  it("onUpdate Restrict は書き込み前に throw するので false", () => {
    const context = contextOf(postsOneToMany({ onUpdate: "Restrict" }));
    expect(shouldBufferUpdate(context, { id: 9 })).toBe(false);
  });

  it("manyToMany の SetNull は resolver がスキップするので false", () => {
    const context = contextOf({
      tags: {
        type: "manyToMany",
        to: "Tags",
        field: "id",
        reference: "id",
        through: { sheet: "PostTags", field: "postId", reference: "tagId" },
        onUpdate: "SetNull",
      },
    });
    expect(shouldBufferUpdate(context, { id: 9 })).toBe(false);
  });

  it("manyToMany の Cascade は through に書くので true", () => {
    const context = contextOf({
      tags: {
        type: "manyToMany",
        to: "Tags",
        field: "id",
        reference: "id",
        through: { sheet: "PostTags", field: "postId", reference: "tagId" },
        onUpdate: "Cascade",
      },
    });
    expect(shouldBufferUpdate(context, { id: 9 })).toBe(true);
  });

  it("manyToOne 側の onUpdate は resolver がスキップするので false", () => {
    const context = contextOf({
      author: {
        type: "manyToOne",
        to: "Users",
        field: "authorId",
        reference: "id",
        onUpdate: "Cascade",
      },
    });
    expect(shouldBufferUpdate(context, { authorId: 9 })).toBe(false);
  });

  it("cascade field への数値オペレーションも true", () => {
    const context = contextOf(postsOneToMany({ onUpdate: "Cascade" }));
    expect(shouldBufferUpdate(context, { id: { increment: 1 } })).toBe(true);
  });
});

describe("shouldBufferUpdateMany", () => {
  it("cascade field に触れれば true", () => {
    const context = contextOf(postsOneToMany({ onUpdate: "Cascade" }));
    expect(shouldBufferUpdateMany(context, { id: 9 })).toBe(true);
  });

  it("nested write キーは updateMany では書き込み前に拒否されるので false", () => {
    const context = contextOf(postsOneToMany());
    expect(
      shouldBufferUpdateMany(context, { posts: { connect: [{ id: 1 }] } }),
    ).toBe(false);
  });
});

describe("shouldBufferDelete", () => {
  it("relationContext が無ければ false", () => {
    expect(shouldBufferDelete(null)).toBe(false);
  });

  it("onDelete 未指定 / NoAction / Restrict だけなら false", () => {
    expect(shouldBufferDelete(contextOf(postsOneToMany()))).toBe(false);
    expect(
      shouldBufferDelete(contextOf(postsOneToMany({ onDelete: "NoAction" }))),
    ).toBe(false);
    expect(
      shouldBufferDelete(contextOf(postsOneToMany({ onDelete: "Restrict" }))),
    ).toBe(false);
  });

  it("oneToMany の Cascade / SetNull は true", () => {
    expect(
      shouldBufferDelete(contextOf(postsOneToMany({ onDelete: "Cascade" }))),
    ).toBe(true);
    expect(
      shouldBufferDelete(contextOf(postsOneToMany({ onDelete: "SetNull" }))),
    ).toBe(true);
  });

  it("manyToMany は Cascade のみ true(SetNull はスキップされる)", () => {
    const m2m = (onDelete: "Cascade" | "SetNull") =>
      contextOf({
        tags: {
          type: "manyToMany",
          to: "Tags",
          field: "id",
          reference: "id",
          through: { sheet: "PostTags", field: "postId", reference: "tagId" },
          onDelete,
        },
      });
    expect(shouldBufferDelete(m2m("Cascade"))).toBe(true);
    expect(shouldBufferDelete(m2m("SetNull"))).toBe(false);
  });

  it("manyToOne 側の onDelete は resolver がスキップするので false", () => {
    const context = contextOf({
      author: {
        type: "manyToOne",
        to: "Users",
        field: "authorId",
        reference: "id",
        onDelete: "Cascade",
      },
    });
    expect(shouldBufferDelete(context)).toBe(false);
  });
});

describe("shouldBufferUpsert", () => {
  const context = () => contextOf(postsOneToMany({ onUpdate: "Cascade" }));

  it("create ブランチに nested write があれば true", () => {
    expect(
      shouldBufferUpsert(context(), {
        create: { id: 1, posts: { create: [{ id: 2 }] } },
        update: { name: "B" },
      }),
    ).toBe(true);
  });

  it("update ブランチが cascade field に触れれば true", () => {
    expect(
      shouldBufferUpsert(context(), {
        create: { id: 1 },
        update: { id: 9 },
      }),
    ).toBe(true);
  });

  it("どちらのブランチも該当しなければ false", () => {
    expect(
      shouldBufferUpsert(context(), {
        create: { id: 1 },
        update: { name: "B" },
      }),
    ).toBe(false);
  });

  it("入力が undefined なら false", () => {
    expect(shouldBufferUpsert(context(), undefined)).toBe(false);
  });
});
