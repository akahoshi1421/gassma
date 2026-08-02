import { GassmaUnknownArgumentError } from "../../../../errors/argument/argumentError";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "../../transaction/transactionTestClient";

const initialUsers = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

const initialPosts = [
  ["id", "authorId", "title"],
  [101, 1, "Post A"],
  [102, 2, "Post B"],
];

const buildCascadeEnv = () => {
  const env = buildTxTestEnv({ relations: true, cascade: true });
  const users = Reflect.get(env.client, "Users");
  return { env, users };
};

afterEach(() => {
  clearGasGlobals();
});

describe("列名の検証は Cascade より先に行われる", () => {
  it("update: 参照キー変更 + typo はエラーになり両シートが無変化", () => {
    const { env, users } = buildCascadeEnv();

    expect(() =>
      users.update({ where: { id: 1 }, data: { id: 100, nmae: "X" } }),
    ).toThrow(GassmaUnknownArgumentError);

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });

  it("updateMany: 参照キー変更 + typo はエラーになり両シートが無変化", () => {
    const { env, users } = buildCascadeEnv();

    expect(() =>
      users.updateMany({ where: { id: 1 }, data: { id: 100, nmae: "X" } }),
    ).toThrow(GassmaUnknownArgumentError);

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });

  it("updateManyAndReturn: 参照キー変更 + typo はエラーになり両シートが無変化", () => {
    const { env, users } = buildCascadeEnv();

    expect(() =>
      users.updateManyAndReturn({
        where: { id: 1 },
        data: { id: 100, nmae: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });

  it("upsert(update枝): 参照キー変更 + typo はエラーになり両シートが無変化", () => {
    const { env, users } = buildCascadeEnv();

    expect(() =>
      users.upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice", age: 20 },
        update: { id: 100, nmae: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });

  it("updateMany: relation キー + 参照キー変更もエラーになり両シートが無変化", () => {
    const { env, users } = buildCascadeEnv();

    expect(() =>
      users.updateMany({
        where: { id: 1 },
        data: { id: 100, posts: { set: [] } },
      }),
    ).toThrow(GassmaUnknownArgumentError);

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });
});

describe("前倒し検証が正当な操作を壊さない", () => {
  it("update: 参照キー変更の Cascade は従来どおり子に伝播する", () => {
    const { env, users } = buildCascadeEnv();

    const result = users.update({ where: { id: 1 }, data: { id: 100 } });

    expect(result).toEqual({ id: 100, name: "Alice", age: 20 });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [100, "Alice", 20],
      [2, "Bob", 30],
    ]);
    expect(env.posts.snapshot()).toEqual([
      ["id", "authorId", "title"],
      [101, 100, "Post A"],
      [102, 2, "Post B"],
    ]);
  });

  it("update: scalar + nested update の混在が従来どおり通る", () => {
    const { env, users } = buildCascadeEnv();

    const result = users.update({
      where: { id: 1 },
      data: {
        name: "Alice2",
        posts: { update: { where: { id: 101 }, data: { title: "New A" } } },
      },
    });

    expect(result).toEqual({ id: 1, name: "Alice2", age: 20 });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice2", 20],
      [2, "Bob", 30],
    ]);
    expect(env.posts.snapshot()).toEqual([
      ["id", "authorId", "title"],
      [101, 1, "New A"],
      [102, 2, "Post B"],
    ]);
  });

  it("upsert(update枝): 参照キー変更の Cascade は従来どおり子に伝播する", () => {
    const { env, users } = buildCascadeEnv();

    const result = users.upsert({
      where: { id: 1 },
      create: { id: 1, name: "Alice", age: 20 },
      update: { id: 100 },
    });

    expect(result).toEqual({ id: 100, name: "Alice", age: 20 });
    expect(env.posts.snapshot()).toEqual([
      ["id", "authorId", "title"],
      [101, 100, "Post A"],
      [102, 2, "Post B"],
    ]);
  });

  it("update: where が一致しなくても typo はエラーになり両シートが無変化", () => {
    const { env, users } = buildCascadeEnv();

    expect(() =>
      users.update({ where: { id: 999 }, data: { id: 100, nmae: "X" } }),
    ).toThrow(GassmaUnknownArgumentError);

    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });

  it("update: where が一致せず typo も無い場合は従来どおり null を返す", () => {
    const { env, users } = buildCascadeEnv();

    const result = users.update({ where: { id: 999 }, data: { id: 100 } });

    expect(result).toBeNull();
    expect(env.users.snapshot()).toEqual(initialUsers);
    expect(env.posts.snapshot()).toEqual(initialPosts);
  });
});
