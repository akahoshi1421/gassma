import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

const idLabelExtension = {
  result: {
    $allModels: {
      idLabel: {
        needs: { id: true },
        compute: (record: { id: number }) => `#${record.id}`,
      },
    },
  },
};

describe("$extends result: $allModels 基本動作", () => {
  test("findMany で全モデルの各レコードに算出フィールドが付く", () => {
    const client = buildTestClient();
    const extended = client.$extends(idLabelExtension);
    expect(extended.Users.findMany({})).toEqual([
      { id: 1, name: "Alice", age: 20, idLabel: "#1" },
      { id: 2, name: "Bob", age: 30, idLabel: "#2" },
      { id: 3, name: "Carol", age: 40, idLabel: "#3" },
    ]);
    expect(extended.Posts.findMany({})).toEqual([
      { id: 101, authorId: 1, title: "Post A", idLabel: "#101" },
      { id: 102, authorId: 2, title: "Post B", idLabel: "#102" },
    ]);
  });

  test("findFirst でも各モデルに付く", () => {
    const client = buildTestClient();
    const extended = client.$extends(idLabelExtension);
    expect(extended.Users.findFirst({ where: { id: 2 } })).toEqual({
      id: 2,
      name: "Bob",
      age: 30,
      idLabel: "#2",
    });
    expect(extended.Posts.findFirst({ where: { id: 101 } })).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
      idLabel: "#101",
    });
  });

  test("元クライアントには影響しない", () => {
    const client = buildTestClient();
    void client.$extends(idLabelExtension);
    expect(sheetOf(client, "Users").findMany({ where: { id: 1 } })).toEqual([
      { id: 1, name: "Alice", age: 20 },
    ]);
    expect(sheetOf(client, "Posts").findMany({ where: { id: 101 } })).toEqual([
      { id: 101, authorId: 1, title: "Post A" },
    ]);
  });
});

describe("$extends result: $allModels とモデル固有の合成", () => {
  test("同名フィールドは定義順によらずモデル固有が勝ち他モデルは $allModels のまま", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          idLabel: {
            needs: { id: true },
            compute: (record: { id: number }) => `User-${record.id}`,
          },
        },
        $allModels: {
          idLabel: {
            needs: { id: true },
            compute: (record: { id: number }) => `#${record.id}`,
          },
        },
      },
    });
    expect(
      extended.Users.findFirst({ where: { id: 1 }, select: { idLabel: true } }),
    ).toEqual({ idLabel: "User-1" });
    expect(
      extended.Posts.findFirst({
        where: { id: 101 },
        select: { idLabel: true },
      }),
    ).toEqual({ idLabel: "#101" });
  });

  test("別名なら $allModels とモデル固有の両方が付く", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        $allModels: {
          idLabel: {
            needs: { id: true },
            compute: (record: { id: number }) => `#${record.id}`,
          },
        },
        Users: {
          fullName: {
            needs: { name: true },
            compute: (user: { name: string }) => `Mr. ${user.name}`,
          },
        },
      },
    });
    expect(extended.Users.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
      idLabel: "#1",
      fullName: "Mr. Alice",
    });
    expect(extended.Posts.findFirst({ where: { id: 102 } })).toEqual({
      id: 102,
      authorId: 2,
      title: "Post B",
      idLabel: "#102",
    });
  });

  test("モデル固有の算出フィールドは $allModels の算出フィールドに依存できる", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          banner: {
            needs: { idLabel: true },
            compute: (user: { idLabel: string }) => `banner(${user.idLabel})`,
          },
        },
        $allModels: {
          idLabel: {
            needs: { id: true },
            compute: (record: { id: number }) => `#${record.id}`,
          },
        },
      },
    });
    expect(
      extended.Users.findFirst({ where: { id: 3 }, select: { banner: true } }),
    ).toEqual({ banner: "banner(#3)" });
  });

  test("複数拡張のチェーンでは後の拡張の $allModels が前のモデル固有に勝つ", () => {
    const client = buildTestClient();
    const extended = client
      .$extends({
        result: {
          Users: {
            idLabel: {
              needs: { id: true },
              compute: (record: { id: number }) => `User-${record.id}`,
            },
          },
        },
      })
      .$extends({
        result: {
          $allModels: {
            idLabel: {
              needs: { id: true },
              compute: (record: { id: number }) => `#${record.id}`,
            },
          },
        },
      });
    expect(
      extended.Users.findFirst({ where: { id: 1 }, select: { idLabel: true } }),
    ).toEqual({ idLabel: "#1" });
  });
});

describe("$extends result: $allModels の select / omit 連携", () => {
  test("select で $allModels の算出フィールドを指定すると needs は補完後に除去される", () => {
    const client = buildTestClient();
    const extended = client.$extends(idLabelExtension);
    expect(
      extended.Posts.findMany({ select: { title: true, idLabel: true } }),
    ).toEqual([
      { title: "Post A", idLabel: "#101" },
      { title: "Post B", idLabel: "#102" },
    ]);
  });

  test("omit で $allModels の算出フィールドを除去できる", () => {
    const client = buildTestClient();
    const extended = client.$extends(idLabelExtension);
    expect(
      extended.Users.findFirst({ where: { id: 1 }, omit: { idLabel: true } }),
    ).toEqual({ id: 1, name: "Alice", age: 20 });
  });
});
