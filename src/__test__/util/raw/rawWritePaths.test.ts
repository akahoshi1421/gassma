import { raw } from "../../../util/raw/raw";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

describe("create 経路の raw", () => {
  it("raw されたセルは素通しされ同じ行の他セルはエスケープされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.create({
      data: { id: 4, name: raw("=SUM(A1:A2)"), age: "=danger" },
    });

    expect(users.findFirst({ where: { id: 4 } })).toMatchObject({
      name: "=SUM(A1:A2)",
      age: "'=danger",
    });
  });
});

describe("createMany 経路の raw", () => {
  it("raw された行だけ素通しされ他の行は従来どおりエスケープされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.createMany({
      data: [
        { id: 5, name: raw("=A1"), age: 1 },
        { id: 6, name: "=A1", age: 2 },
      ],
    });

    expect(users.findFirst({ where: { id: 5 } })).toMatchObject({
      name: "=A1",
    });
    expect(users.findFirst({ where: { id: 6 } })).toMatchObject({
      name: "'=A1",
    });
  });

  it("createManyAndReturn 経由でも raw は素通しされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.createManyAndReturn({
      data: [{ id: 7, name: raw("=B1"), age: 3 }],
    });

    expect(users.findFirst({ where: { id: 7 } })).toMatchObject({
      name: "=B1",
    });
  });
});

describe("update / updateMany 経路の raw", () => {
  it("update で raw されたセルは素通しされ他セルはエスケープされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.update({
      where: { id: 1 },
      data: { name: raw("=NOW()"), age: "=cmd" },
    });

    expect(users.findFirst({ where: { id: 1 } })).toMatchObject({
      name: "=NOW()",
      age: "'=cmd",
    });
  });

  it("updateMany で raw されたセルは全行素通しされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.updateMany({
      where: {},
      data: { name: raw("=RAND()"), age: "=cmd" },
    });

    const found = users.findMany({});
    expect(found).toHaveLength(3);
    found.forEach((record) => {
      expect(record).toMatchObject({ name: "=RAND()", age: "'=cmd" });
    });
  });
});

describe("upsert 経路の raw", () => {
  it("update 分岐で raw は素通しされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.upsert({
      where: { id: 2 },
      create: { id: 2, name: "none", age: 0 },
      update: { name: raw("=U1") },
    });

    expect(users.findFirst({ where: { id: 2 } })).toMatchObject({
      name: "=U1",
    });
  });

  it("create 分岐で raw は素通しされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    users.upsert({
      where: { id: 99 },
      create: { id: 99, name: raw("=C1"), age: 0 },
      update: {},
    });

    expect(users.findFirst({ where: { id: 99 } })).toMatchObject({
      name: "=C1",
    });
  });
});

describe("nested write 経路の raw", () => {
  it("create の nested create でも raw は素通しされる", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");

    users.create({
      data: {
        id: 8,
        name: "Dave",
        age: 1,
        posts: { create: { id: 103, title: raw("=IMPORTRANGE(1)") } },
      },
    });

    const posts = sheetOf(client, "Posts");
    expect(posts.findFirst({ where: { id: 103 } })).toMatchObject({
      title: "=IMPORTRANGE(1)",
      authorId: 8,
    });
  });

  it("update の nested create でも親子ともに raw は素通しされる", () => {
    const client = buildTestClient({ relations: true });
    const posts: any = sheetOf(client, "Posts");

    posts.update({
      where: { id: 101 },
      data: {
        title: raw("=SUM(B:B)"),
        comments: { create: { id: 1004, body: raw("=cmd2") } },
      },
    });

    expect(posts.findFirst({ where: { id: 101 } })).toMatchObject({
      title: "=SUM(B:B)",
    });

    const comments = sheetOf(client, "Comments");
    expect(comments.findFirst({ where: { id: 1004 } })).toMatchObject({
      body: "=cmd2",
      postId: 101,
    });
  });
});

describe("@default / @updatedAt との併用", () => {
  it("defaults が適用されても raw は壊れない", () => {
    const users = sheetOf(buildTestClient(), "Users");
    users._setDefaults({ age: 99 });

    users.create({ data: { id: 10, name: raw("=X1") } });

    expect(users.findFirst({ where: { id: 10 } })).toMatchObject({
      name: "=X1",
      age: 99,
    });
  });

  it("updatedAt が適用されても raw は壊れない", () => {
    const users = sheetOf(buildTestClient(), "Users");
    users._setUpdatedAt(["age"]);

    users.create({ data: { id: 11, name: raw("=Y1") } });

    expect(users.findFirst({ where: { id: 11 } })).toMatchObject({
      name: "=Y1",
      age: expect.any(Date),
    });
  });
});
