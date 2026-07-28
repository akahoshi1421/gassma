import { NestedWriteConnectNotFoundError } from "../../../../errors/relation/nestedWriteError";
import type { FilterConditions, WhereUse } from "../../../../types/coreTypes";
import type { NestedWriteOperation } from "../../../../types/nestedWriteTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";
import { processAfterCreate } from "../../../../util/create/nestedWrite/processAfterCreate";
import { FieldRef } from "../../../../util/filterConditions/fieldRef";

const fc = (obj: Record<string, unknown>) => obj as FilterConditions;

type Row = Record<string, unknown>;

const matchesPlain = (record: Row, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([key, value]) => {
    if (key === "OR") {
      const branches = Array.isArray(value) ? value : [value];
      return branches.some(
        (branch) => typeof branch === "object" && matchesPlain(record, branch),
      );
    }
    if (!(key in record)) return true;
    if (value !== null && typeof value === "object") return false;
    const wanted = value === "" ? null : value;
    return record[key] === wanted;
  });

const makeSheet = (initialRows: Row[]) => {
  const rows: Row[] = initialRows.map((row) => ({ ...row }));

  const findManyOnSheet = jest.fn(
    (_sheet: string, findData: { where?: WhereUse }) => {
      const where = findData.where ?? {};
      if (Object.keys(where).length === 0) return rows.map((r) => ({ ...r }));
      return rows
        .filter((row) => matchesPlain(row, where))
        .map((r) => ({ ...r }));
    },
  );

  const updateManyOnSheet = jest.fn(
    (_sheet: string, updateData: { where?: WhereUse; data: Row }) => {
      const where = updateData.where ?? {};
      let count = 0;
      rows.forEach((row) => {
        if (!matchesPlain(row, where)) return;
        Object.assign(row, updateData.data);
        count += 1;
      });
      return { count };
    },
  );

  const createOnSheet = jest.fn((_sheet: string, createData: { data: Row }) => {
    const record = { ...createData.data };
    rows.push(record);
    return { ...record };
  });

  return { rows, findManyOnSheet, updateManyOnSheet, createOnSheet };
};

const postsRelation: RelationDefinition = {
  type: "oneToMany",
  to: "Posts",
  field: "id",
  reference: "authorId",
};

const makeContext = (
  sheet: ReturnType<typeof makeSheet>,
  relationNames?: string[],
): RelationContext => {
  const context: RelationContext = {
    relations: { posts: postsRelation },
    findManyOnSheet: sheet.findManyOnSheet,
    updateManyOnSheet: sheet.updateManyOnSheet,
    createOnSheet: sheet.createOnSheet,
  };
  if (relationNames) {
    context.relationNamesOnSheet = () => relationNames;
  }
  return context;
};

const runConnect = (
  sheet: ReturnType<typeof makeSheet>,
  connect: WhereUse[],
  relationNames?: string[],
) => {
  const relationOps = new Map<string, NestedWriteOperation>();
  relationOps.set("posts", { connect });
  processAfterCreate(
    { id: 1, name: "田中" },
    relationOps,
    makeContext(sheet, relationNames),
  );
};

const runConnectOrCreate = (
  sheet: ReturnType<typeof makeSheet>,
  connectOrCreate: { where: WhereUse; create: Row }[],
) => {
  const relationOps = new Map<string, NestedWriteOperation>();
  relationOps.set("posts", { connectOrCreate });
  processAfterCreate({ id: 1, name: "田中" }, relationOps, makeContext(sheet));
};

describe("processAfterCreate connect のバッチ化", () => {
  it("複数 connect は読み 1 回・書き 1 回にまとまる", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: null },
      { id: 12, title: "C", authorId: null },
      { id: 13, title: "D", authorId: null },
    ]);

    runConnect(sheet, [{ id: 10 }, { id: 11 }, { id: 12 }]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { OR: [{ id: 10 }, { id: 11 }, { id: 12 }] },
      data: { authorId: 1 },
    });
    expect(sheet.createOnSheet).not.toHaveBeenCalled();
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1, 1, null]);
  });

  it("1件でも不在なら 1 セルも書かずに従来と同一のエラーを投げる", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: null },
    ]);
    const run = () => runConnect(sheet, [{ id: 10 }, { id: 11 }, { id: 999 }]);

    expect(run).toThrow(NestedWriteConnectNotFoundError);
    expect(run).toThrow(
      'Nested write connect failed: no record found in "Posts"',
    );
    expect(sheet.updateManyOnSheet).not.toHaveBeenCalled();
    expect(sheet.createOnSheet).not.toHaveBeenCalled();
    expect(sheet.rows.map((row) => row.authorId)).toEqual([null, null]);
  });

  it("where が重複していても最終状態は同じで書きは 1 回", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: null },
    ]);

    runConnect(sheet, [{ id: 10 }, { id: 10 }, { id: 11 }]);

    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1]);
  });

  it("複数行にマッチする where もまとめて更新される", () => {
    const sheet = makeSheet([
      { id: 10, flag: true, authorId: null },
      { id: 11, flag: true, authorId: null },
      { id: 12, flag: false, authorId: null },
    ]);

    runConnect(sheet, [{ flag: true }, { id: 12 }]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1, 1]);
  });

  it("connect が空配列なら何も呼ばれない", () => {
    const sheet = makeSheet([{ id: 10, authorId: null }]);

    runConnect(sheet, []);

    expect(sheet.findManyOnSheet).not.toHaveBeenCalled();
    expect(sheet.updateManyOnSheet).not.toHaveBeenCalled();
  });

  it("テーブルに無いキーを含む項目はその項目だけ従来の個別読み書きに戻す", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: null },
    ]);

    runConnect(sheet, [{ id: 10 }, { ghost: 9 }]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { ghost: 9 },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 10 },
      data: { authorId: 1 },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { ghost: 9 },
      data: { authorId: 1 },
    });
  });

  it("トップレベルに空文字を含む項目は OR 合成せず個別更新する", () => {
    const sheet = makeSheet([
      { id: 10, name: null, authorId: null },
      { id: 11, name: "x", authorId: null },
    ]);

    runConnect(sheet, [{ id: 11 }, { name: "" }]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { id: 11 },
      data: { authorId: 1 },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { name: "" },
      data: { authorId: 1 },
    });
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1]);
  });

  it("ターゲットのリレーション名と同名キーを含む項目は個別処理に戻す", () => {
    const sheet = makeSheet([
      { id: 10, author: "x", authorId: null },
      { id: 11, author: "y", authorId: null },
    ]);

    runConnect(sheet, [{ id: 10 }, { author: "y" }], ["author"]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { author: "y" },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1]);
  });

  it("FieldRef を含む where もローカル判定で読み 1 回になる", () => {
    const sheet = makeSheet([
      { id: 10, score: 5, cap: 3, authorId: null },
      { id: 11, score: 2, cap: 3, authorId: null },
    ]);

    runConnect(sheet, [
      { score: fc({ gt: new FieldRef("Posts", "cap") }) },
      { id: 11 },
    ]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: {
        OR: [{ score: fc({ gt: new FieldRef("Posts", "cap") }) }, { id: 11 }],
      },
      data: { authorId: 1 },
    });
  });

  it("空シートへの複数 connect は読み 1 回で書かずにエラー", () => {
    const sheet = makeSheet([]);
    const run = () => runConnect(sheet, [{ id: 1 }, { id: 2 }]);

    expect(run).toThrow(NestedWriteConnectNotFoundError);
    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.updateManyOnSheet).not.toHaveBeenCalled();
  });

  it("空シートでもリレーション名キーを含む項目は個別読みに回す", () => {
    const sheet = makeSheet([]);
    const run = () =>
      runConnect(
        sheet,
        [{ id: 1 }, { author: { is: { name: "x" } } }],
        ["author"],
      );

    expect(run).toThrow(NestedWriteConnectNotFoundError);
    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { author: { is: { name: "x" } } },
    });
    expect(sheet.updateManyOnSheet).not.toHaveBeenCalled();
  });
});

describe("processAfterCreate connectOrCreate のバッチ化", () => {
  it("全件既存なら読み 1 回・更新 1 回・作成 0 回", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: null },
      { id: 12, title: "C", authorId: null },
    ]);

    runConnectOrCreate(sheet, [
      { where: { id: 10 }, create: { id: 10, title: "A" } },
      { where: { id: 11 }, create: { id: 11, title: "B" } },
      { where: { id: 12 }, create: { id: 12, title: "C" } },
    ]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { OR: [{ id: 10 }, { id: 11 }, { id: 12 }] },
      data: { authorId: 1 },
    });
    expect(sheet.createOnSheet).not.toHaveBeenCalled();
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1, 1]);
  });

  it("全件不在なら items 順で作成される", () => {
    const sheet = makeSheet([{ id: 10, title: "A", authorId: null }]);

    runConnectOrCreate(sheet, [
      { where: { id: 20 }, create: { id: 20, title: "X" } },
      { where: { id: 21 }, create: { id: 21, title: "Y" } },
      { where: { id: 22 }, create: { id: 22, title: "Z" } },
    ]);

    expect(sheet.createOnSheet).toHaveBeenCalledTimes(3);
    expect(sheet.createOnSheet).toHaveBeenNthCalledWith(1, "Posts", {
      data: { id: 20, title: "X", authorId: 1 },
    });
    expect(sheet.createOnSheet).toHaveBeenNthCalledWith(2, "Posts", {
      data: { id: 21, title: "Y", authorId: 1 },
    });
    expect(sheet.createOnSheet).toHaveBeenNthCalledWith(3, "Posts", {
      data: { id: 22, title: "Z", authorId: 1 },
    });
    expect(sheet.updateManyOnSheet).not.toHaveBeenCalled();
    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(3);
    expect(sheet.findManyOnSheet).toHaveBeenCalledWith("Posts", {});
    expect(sheet.rows.map((row) => row.id)).toEqual([10, 20, 21, 22]);
  });

  it("同一 where の重複項目は 2 重作成されない", () => {
    const sheet = makeSheet([]);

    runConnectOrCreate(sheet, [
      { where: { email: "a" }, create: { email: "a", title: "X" } },
      { where: { email: "a" }, create: { email: "a", title: "Y" } },
    ]);

    expect(sheet.createOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.createOnSheet).toHaveBeenCalledWith("Posts", {
      data: { email: "a", title: "X", authorId: 1 },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { email: "a" },
      data: { authorId: 1 },
    });
    expect(sheet.rows).toHaveLength(1);
  });

  it("既存と不在の混在では読み 1 回・作成は items 順", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: null },
    ]);

    runConnectOrCreate(sheet, [
      { where: { id: 10 }, create: { id: 10, title: "A" } },
      { where: { id: 20 }, create: { id: 20, title: "N" } },
      { where: { id: 11 }, create: { id: 11, title: "B" } },
    ]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.createOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.createOnSheet).toHaveBeenCalledWith("Posts", {
      data: { id: 20, title: "N", authorId: 1 },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(1);
    expect(sheet.updateManyOnSheet).toHaveBeenCalledWith("Posts", {
      where: { OR: [{ id: 10 }, { id: 11 }] },
      data: { authorId: 1 },
    });
    const createOrder = sheet.createOnSheet.mock.invocationCallOrder[0];
    const updateOrder = sheet.updateManyOnSheet.mock.invocationCallOrder[0];
    expect(createOrder).toBeLessThan(updateOrder);
    expect(sheet.rows.map((row) => row.id)).toEqual([10, 11, 20]);
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1, 1]);
  });

  it("FK カラムを参照する where を含む場合は全体を従来動作に戻す", () => {
    const sheet = makeSheet([
      { id: 10, title: "A", authorId: null },
      { id: 11, title: "B", authorId: 9 },
    ]);

    runConnectOrCreate(sheet, [
      { where: { authorId: null }, create: { id: 30, title: "N" } },
      { where: { id: 11 }, create: { id: 11, title: "B" } },
    ]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.findManyOnSheet).toHaveBeenNthCalledWith(1, "Posts", {
      where: { authorId: null },
    });
    expect(sheet.findManyOnSheet).toHaveBeenNthCalledWith(2, "Posts", {
      where: { id: 11 },
    });
    expect(sheet.updateManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.rows.map((row) => row.authorId)).toEqual([1, 1]);
  });

  it("空シートでは作成が進むたびに再読して重複作成を防ぐ", () => {
    const sheet = makeSheet([]);

    runConnectOrCreate(sheet, [
      { where: { id: 20 }, create: { id: 20, title: "X" } },
      { where: { id: 21 }, create: { id: 21, title: "Y" } },
    ]);

    expect(sheet.findManyOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.createOnSheet).toHaveBeenCalledTimes(2);
    expect(sheet.rows.map((row) => row.id)).toEqual([20, 21]);
  });
});
