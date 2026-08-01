import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import {
  containsValue,
  isValueEqual,
} from "../../../../util/other/isValueEqual";
import { CASCADE_TEMP_PREFIX } from "../../../../util/relation/onUpdate/cascadeTempValue";
import { resolveOnUpdate } from "../../../../util/relation/onUpdate/resolveOnUpdate";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "../../transaction/transactionTestClient";

type Row = Record<string, unknown>;

const inList = (condition: unknown): unknown[] | null => {
  if (condition === null || typeof condition !== "object") return null;
  const candidate = Reflect.get(condition, "in");
  return Array.isArray(candidate) ? candidate : null;
};

const matchesWhere = (row: Row, where?: Record<string, unknown>): boolean =>
  Object.entries(where ?? {}).every(([field, condition]) => {
    const list = inList(condition);
    if (list) return containsValue(list, row[field]);
    return isValueEqual(row[field], condition);
  });

type UpdateCall = { sheet: string; where: unknown; data: unknown };

type Store = {
  context: RelationContext;
  rows: (sheet: string) => Row[];
  updateCalls: UpdateCall[];
  findCalls: string[];
};

const makeStore = (
  relations: Record<string, RelationDefinition>,
  sheets: Record<string, Row[]>,
): Store => {
  const data: Record<string, Row[]> = {};
  Object.entries(sheets).forEach(([name, rows]) => {
    data[name] = rows.map((row) => ({ ...row }));
  });
  const updateCalls: UpdateCall[] = [];
  const findCalls: string[] = [];

  const context: RelationContext = {
    relations,
    findManyOnSheet: (sheetName, findData) => {
      findCalls.push(sheetName);
      return (data[sheetName] ?? []).filter((row) =>
        matchesWhere(row, findData.where),
      );
    },
    updateManyOnSheet: (sheetName, updateData) => {
      updateCalls.push({
        sheet: sheetName,
        where: updateData.where,
        data: updateData.data,
      });
      const targets = (data[sheetName] ?? []).filter((row) =>
        matchesWhere(row, updateData.where),
      );
      targets.forEach((row) => {
        Object.assign(row, updateData.data);
      });
      return { count: targets.length };
    },
  };

  return {
    context,
    rows: (sheet) => data[sheet] ?? [],
    updateCalls,
    findCalls,
  };
};

const oneToManyCascade: Record<string, RelationDefinition> = {
  posts: {
    type: "oneToMany",
    to: "Posts",
    field: "id",
    reference: "authorId",
    onUpdate: "Cascade",
  },
};

const manyToManyCascade: Record<string, RelationDefinition> = {
  tags: {
    type: "manyToMany",
    to: "Tags",
    field: "id",
    reference: "id",
    through: { sheet: "PostTags", field: "postId", reference: "tagId" },
    onUpdate: "Cascade",
  },
};

describe("Cascade onUpdate は先行する更新結果を拾わない（oneToMany）", () => {
  it("id を一括インクリメントしても子の FK が玉突きしない", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 3 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 3 },
    ]);
  });

  it("3件の連鎖インクリメントでも玉突きしない", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
        { id: 103, authorId: 3 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      [{ id: 2 }, { id: 3 }, { id: 4 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 3 },
      { id: 103, authorId: 4 },
    ]);
  });

  it("デクリメント方向（先に空く側）でも正しい", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 2 },
        { id: 102, authorId: 3 },
      ],
    });

    resolveOnUpdate(
      [{ id: 2 }, { id: 3 }],
      [{ id: 1 }, { id: 2 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 1 },
      { id: 102, authorId: 2 },
    ]);
  });

  it("2値の入れ替え（循環）でも入れ替わる", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 1 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 1 },
    ]);
  });

  it("3値の循環（1→2→3→1）でも正しく回る", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
        { id: 103, authorId: 3 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      [{ id: 2 }, { id: 3 }, { id: 1 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 3 },
      { id: 103, authorId: 1 },
    ]);
  });

  it("循環と非循環が混在しても両方正しい", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
        { id: 103, authorId: 7 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }, { id: 7 }],
      [{ id: 2 }, { id: 1 }, { id: 8 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 1 },
      { id: 103, authorId: 8 },
    ]);
  });

  it("循環処理は無関係な行を巻き込まない", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
        { id: 103, authorId: 5 },
        { id: 104, authorId: null },
        { id: 105, authorId: "keep" },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 1 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 1 },
      { id: 103, authorId: 5 },
      { id: 104, authorId: null },
      { id: 105, authorId: "keep" },
    ]);
  });

  it("Date キーの入れ替えでも正しい", () => {
    const a = new Date("2026-01-01T00:00:00.000Z");
    const b = new Date("2026-02-01T00:00:00.000Z");
    const store = makeStore(
      {
        posts: {
          type: "oneToMany",
          to: "Posts",
          field: "key",
          reference: "authorKey",
          onUpdate: "Cascade",
        },
      },
      {
        Posts: [
          { id: 101, authorKey: new Date(a.getTime()) },
          { id: 102, authorKey: new Date(b.getTime()) },
        ],
      },
    );

    resolveOnUpdate(
      [{ key: a }, { key: b }],
      [{ key: b }, { key: a }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorKey: b },
      { id: 102, authorKey: a },
    ]);
  });
});

describe("Cascade onUpdate は先行する更新結果を拾わない（manyToMany）", () => {
  it("中間テーブルの玉突きが起きない", () => {
    const store = makeStore(manyToManyCascade, {
      PostTags: [
        { postId: 1, tagId: 9 },
        { postId: 2, tagId: 9 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 3 }],
      store.context,
    );

    expect(store.rows("PostTags")).toEqual([
      { postId: 2, tagId: 9 },
      { postId: 3, tagId: 9 },
    ]);
  });

  it("中間テーブルでも入れ替え（循環）が成立する", () => {
    const store = makeStore(manyToManyCascade, {
      PostTags: [
        { postId: 1, tagId: 9 },
        { postId: 2, tagId: 9 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 1 }],
      store.context,
    );

    expect(store.rows("PostTags")).toEqual([
      { postId: 2, tagId: 9 },
      { postId: 1, tagId: 9 },
    ]);
  });
});

describe("Cascade onUpdate の更新呼び出し回数", () => {
  it("同じ新値に集約されるペアは1回の updateMany にまとめる", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 9 }, { id: 9 }],
      store.context,
    );

    expect(store.updateCalls).toEqual([
      {
        sheet: "Posts",
        where: { authorId: { in: [1, 2] } },
        data: { authorId: 9 },
      },
    ]);
    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 9 },
      { id: 102, authorId: 9 },
    ]);
  });

  it("独立したペアは並べ替えても余計な往復を増やさない", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 3 }],
      store.context,
    );

    expect(store.updateCalls).toHaveLength(2);
    expect(store.findCalls).toEqual([]);
  });

  it("同じ旧値が複数ペアに現れた場合は最初のペアを採用する", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [{ id: 101, authorId: 1 }],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 1 }],
      [{ id: 5 }, { id: 6 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([{ id: 101, authorId: 5 }]);
  });
});

describe("updateMany 経由の Cascade（実クライアント）", () => {
  afterEach(() => {
    clearGasGlobals();
    jest.restoreAllMocks();
  });

  it("全ユーザーの id を +1 しても Post の所有者が入れ替わらない", () => {
    const env = buildTxTestEnv({ relations: true, cascade: true });
    const users = Reflect.get(env.client, "Users");

    users.updateMany({ where: {}, data: { id: { increment: 1 } } });

    expect(env.posts.snapshot()).toEqual([
      ["id", "authorId", "title"],
      [101, 2, "Post A"],
      [102, 3, "Post B"],
    ]);
  });
});

describe("Cascade の一時値はシート上の既存値と衝突しない", () => {
  it("一時値そのものを FK に持つ行が入れ替えに巻き込まれない", () => {
    const store = makeStore(oneToManyCascade, {
      Posts: [
        { id: 101, authorId: 1 },
        { id: 102, authorId: 2 },
        { id: 103, authorId: `${CASCADE_TEMP_PREFIX}0` },
      ],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 1 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([
      { id: 101, authorId: 2 },
      { id: 102, authorId: 1 },
      { id: 103, authorId: `${CASCADE_TEMP_PREFIX}0` },
    ]);
  });
});

describe("Cascade の一時値は入れ替え対象の値とも衝突しない", () => {
  it("親の新キーが一時値と同じ文字列でも入れ替えが成立する", () => {
    const sentinel = `${CASCADE_TEMP_PREFIX}0`;
    const store = makeStore(oneToManyCascade, {
      Posts: [{ id: 101, authorId: 1 }],
    });

    resolveOnUpdate(
      [{ id: 1 }, { id: sentinel }],
      [{ id: sentinel }, { id: 1 }],
      store.context,
    );

    expect(store.rows("Posts")).toEqual([{ id: 101, authorId: sentinel }]);
  });
});
