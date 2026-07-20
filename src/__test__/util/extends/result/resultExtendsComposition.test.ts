import { buildTestClient, clearSpreadsheetApp } from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

describe("$extends result: 依存と上書き", () => {
  test("算出フィールド同士の依存は宣言順によらず依存順に計算される", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          greeting: {
            needs: { fullName: true },
            compute: (user: { fullName: string }) => `Hello, ${user.fullName}`,
          },
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
      fullName: "Mr. Alice",
      greeting: "Hello, Mr. Alice",
    });
  });

  test("3 段の依存連鎖も解決される", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          c: {
            needs: { b: true },
            compute: (user: { b: string }) => `c(${user.b})`,
          },
          b: {
            needs: { a: true },
            compute: (user: { a: string }) => `b(${user.a})`,
          },
          a: {
            needs: { name: true },
            compute: (user: { name: string }) => `a(${user.name})`,
          },
        },
      },
    });
    const row = extended.Users.findFirst({
      where: { id: 2 },
      select: { id: true, c: true },
    });
    expect(row).toEqual({ id: 2, c: "c(b(a(Bob)))" });
  });

  test("依存する算出フィールドを select しても依存先は出力されない", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          greeting: {
            needs: { fullName: true },
            compute: (user: { fullName: string }) => `Hello, ${user.fullName}`,
          },
          fullName: {
            needs: { name: true },
            compute: (user: { name: string }) => `Mr. ${user.name}`,
          },
        },
      },
    });
    expect(
      extended.Users.findFirst({
        where: { id: 1 },
        select: { id: true, greeting: true },
      }),
    ).toEqual({ id: 1, greeting: "Hello, Mr. Alice" });
  });

  test("既存フィールドと同名の算出フィールドは値を置換し compute は元の値を受け取る", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          name: {
            needs: { name: true },
            compute: (user: { name: string }) => user.name.toUpperCase(),
          },
        },
      },
    });
    expect(extended.Users.findMany({})).toEqual([
      { id: 1, name: "ALICE", age: 20 },
      { id: 2, name: "BOB", age: 30 },
      { id: 3, name: "CAROL", age: 40 },
    ]);
    expect(
      extended.Users.findFirst({ where: { id: 1 }, select: { name: true } }),
    ).toEqual({ name: "ALICE" });
  });
});

describe("$extends result: query 併用とマージ", () => {
  test("同一拡張オブジェクトの query と result が両方効く", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            return query({ ...args, where: { name: "Bob" } });
          },
        },
      },
      result: {
        Users: {
          fullName: {
            needs: { name: true },
            compute: (user: { name: string }) => `Mr. ${user.name}`,
          },
        },
      },
    });
    expect(extended.Users.findMany({})).toEqual([
      { id: 2, name: "Bob", age: 30, fullName: "Mr. Bob" },
    ]);
  });

  test("チェーンした複数の result 拡張はマージされる", () => {
    const client = buildTestClient();
    const extended = client
      .$extends({
        result: {
          Users: {
            fullName: {
              needs: { name: true },
              compute: (user: { name: string }) => `Mr. ${user.name}`,
            },
          },
        },
      })
      .$extends({
        result: {
          Users: {
            ageLabel: {
              needs: { age: true },
              compute: (user: { age: number }) => `${user.age} 歳`,
            },
          },
        },
      });
    expect(extended.Users.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
      fullName: "Mr. Alice",
      ageLabel: "20 歳",
    });
  });

  test("同名の算出フィールドは後から適用した拡張が勝つ", () => {
    const client = buildTestClient();
    const extended = client
      .$extends({
        result: {
          Users: {
            fullName: {
              needs: { name: true },
              compute: (user: { name: string }) => `Mr. ${user.name}`,
            },
          },
        },
      })
      .$extends({
        result: {
          Users: {
            fullName: {
              needs: { name: true },
              compute: (user: { name: string }) => `Dr. ${user.name}`,
            },
          },
        },
      });
    expect(
      extended.Users.findFirst({
        where: { id: 1 },
        select: { fullName: true },
      }),
    ).toEqual({ fullName: "Dr. Alice" });
  });
});

describe("$extends result: nested への伝播", () => {
  const fullNameExtension = {
    result: {
      Users: {
        fullName: {
          needs: { name: true },
          compute: (user: { name: string }) => `Mr. ${user.name}`,
        },
      },
    },
  };

  test("nested include の中の同モデルにも付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(fullNameExtension);
    expect(extended.Posts.findMany({ include: { author: true } })).toEqual([
      {
        id: 101,
        authorId: 1,
        title: "Post A",
        author: { id: 1, name: "Alice", age: 20, fullName: "Mr. Alice" },
      },
      {
        id: 102,
        authorId: 2,
        title: "Post B",
        author: { id: 2, name: "Bob", age: 30, fullName: "Mr. Bob" },
      },
    ]);
  });

  test("result 定義のないモデルの include 先はそのまま", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findMany({ where: { id: 1 }, include: { posts: true } }),
    ).toEqual([
      {
        id: 1,
        name: "Alice",
        age: 20,
        fullName: "Mr. Alice",
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      },
    ]);
  });
});
