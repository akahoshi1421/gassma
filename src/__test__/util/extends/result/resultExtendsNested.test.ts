import { buildTestClient, clearSpreadsheetApp } from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

const nestedExtension = {
  result: {
    Users: {
      fullName: {
        needs: { name: true },
        compute: (user: { name: string }) => `Mr. ${user.name}`,
      },
    },
    Posts: {
      titleUpper: {
        needs: { title: true },
        compute: (post: { title: string }) => post.title.toUpperCase(),
      },
    },
    Comments: {
      excerpt: {
        needs: { body: true },
        compute: (comment: { body: string }) => comment.body.slice(0, 5),
      },
    },
  },
};

describe("$extends result: nested include", () => {
  test("oneToMany include の各 nested レコードに算出フィールドが付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(extended.Users.findMany({ include: { posts: true } })).toEqual([
      {
        id: 1,
        name: "Alice",
        age: 20,
        fullName: "Mr. Alice",
        posts: [
          { id: 101, authorId: 1, title: "Post A", titleUpper: "POST A" },
        ],
      },
      {
        id: 2,
        name: "Bob",
        age: 30,
        fullName: "Mr. Bob",
        posts: [
          { id: 102, authorId: 2, title: "Post B", titleUpper: "POST B" },
        ],
      },
      { id: 3, name: "Carol", age: 40, fullName: "Mr. Carol", posts: [] },
    ]);
  });

  test("manyToOne include の nested レコードに付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(
      extended.Posts.findFirst({
        where: { id: 101 },
        include: { author: true },
      }),
    ).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
      titleUpper: "POST A",
      author: { id: 1, name: "Alice", age: 20, fullName: "Mr. Alice" },
    });
  });

  test("深いネスト（include の中の include）でも付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(
      extended.Users.findFirst({
        where: { id: 1 },
        include: { posts: { include: { comments: true } } },
      }),
    ).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
      fullName: "Mr. Alice",
      posts: [
        {
          id: 101,
          authorId: 1,
          title: "Post A",
          titleUpper: "POST A",
          comments: [
            { id: 1001, postId: 101, body: "Hello world", excerpt: "Hello" },
            { id: 1002, postId: 101, body: "Nice post", excerpt: "Nice " },
          ],
        },
      ],
    });
  });

  test("nested select は needs を確保したうえで整形される", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(
      extended.Users.findFirst({
        where: { id: 1 },
        include: { posts: { select: { id: true, titleUpper: true } } },
      }),
    ).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
      fullName: "Mr. Alice",
      posts: [{ id: 101, titleUpper: "POST A" }],
    });
  });

  test("nested omit は needs を読んで計算しつつ結果から落とす", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(
      extended.Posts.findFirst({
        where: { id: 101 },
        include: { author: { omit: { name: true } } },
      }),
    ).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
      titleUpper: "POST A",
      author: { id: 1, age: 20, fullName: "Mr. Alice" },
    });
  });

  test("select 内のリレーションの nested レコードにも付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(
      extended.Users.findFirst({
        where: { id: 2 },
        select: { name: true, posts: { select: { titleUpper: true } } },
      }),
    ).toEqual({
      name: "Bob",
      posts: [{ titleUpper: "POST B" }],
    });
  });

  test("$allModels の算出フィールドは nested にも付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends({
      result: { $allModels: { tagged: { compute: () => true } } },
    });
    const users = extended.Users.findMany({ include: { posts: true } });
    expect(users.length).toBe(3);
    users.forEach((user: Record<string, unknown>) => {
      expect(user.tagged).toBe(true);
      const posts: unknown = user.posts;
      if (!Array.isArray(posts)) throw new Error("posts が配列でない");
      posts.forEach((post: Record<string, unknown>) => {
        expect(post.tagged).toBe(true);
      });
    });
  });

  test("書き込み系の include にも nested の算出フィールドが付く", () => {
    const client = buildTestClient({ relations: true });
    const extended = client.$extends(nestedExtension);
    expect(
      extended.Posts.update({
        where: { id: 102 },
        data: { title: "Post B2" },
        include: { author: true },
      }),
    ).toEqual({
      id: 102,
      authorId: 2,
      title: "Post B2",
      titleUpper: "POST B2",
      author: { id: 2, name: "Bob", age: 30, fullName: "Mr. Bob" },
    });
  });
});
