import {
  GassmaNestedTransactionError,
  GassmaTransactionLockRequiredError,
  GassmaTransactionLockTimeoutError,
  GassmaTransactionTimeoutError,
} from "../../../errors/transaction/transactionError";
import { buildTxTestEnv, clearGasGlobals } from "./transactionTestClient";

afterEach(() => {
  clearGasGlobals();
  jest.restoreAllMocks();
});

describe("$transaction の基本動作", () => {
  test("fn 正常終了で flush され戻り値が返る", () => {
    const env = buildTxTestEnv();

    const result = env.client.$transaction((tx) => {
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      expect(env.users.writes).toEqual([]);
      return "done";
    });

    expect(result).toBe("done");
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "Carol", 40],
    ]);
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("fn throw で 1 セルも書かれず lock 解放して rethrow", () => {
    const env = buildTxTestEnv();

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(env.users.writes).toEqual([]);
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("tx 終了後の元 client は immediate のまま", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => tx.Users.count({}));
    const writesBefore = env.users.writes.length;
    (env.client as any).Users.update({
      where: { id: 1 },
      data: { age: 21 },
    });

    expect(env.users.writes.length).toBe(writesBefore + 1);
    expect(env.users.snapshot()[1]).toEqual([1, "Alice", 21]);
  });
});

describe("$transaction の read-your-writes", () => {
  test("create → findMany で未 flush の行が見える", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      const found = tx.Users.findMany({});
      expect(found).toHaveLength(3);
      expect(found[2]).toEqual({ id: 3, name: "Carol", age: 40 });
      expect(env.users.writes).toEqual([]);
    });
  });

  test("update → findFirst で未 flush の変更が見える", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.update({ where: { id: 1 }, data: { age: 21 } });
      expect(tx.Users.findFirst({ where: { id: 1 } })).toEqual({
        id: 1,
        name: "Alice",
        age: 21,
      });
      expect(env.users.snapshot()[1]).toEqual([1, "Alice", 20]);
    });
  });

  test("delete → count で未 flush の削除が見える", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.delete({ where: { id: 2 } });
      expect(tx.Users.count({})).toBe(1);
      expect(env.users.snapshot()).toHaveLength(3);
    });
  });

  test("include がオーバーレイ越しに効く", () => {
    const env = buildTxTestEnv({ relations: true });

    env.client.$transaction((tx) => {
      tx.Posts.create({ data: { id: 103, authorId: 1, title: "New" } });
      const found: any[] = tx.Users.findMany({
        where: { id: 1 },
        include: { posts: true },
      });
      expect(found[0].posts).toHaveLength(2);
      expect(found[0].posts[1]).toEqual({
        id: 103,
        authorId: 1,
        title: "New",
      });
    });
  });
});

describe("$transaction の nested write / cascade", () => {
  test("nested create が tx 内で完結し flush で両シートに反映される", () => {
    const env = buildTxTestEnv({ relations: true });

    const carol: any = {
      id: 3,
      name: "Carol",
      age: 40,
      posts: { create: { id: 103, title: "C post" } },
    };

    env.client.$transaction((tx) => {
      tx.Users.create({ data: carol });
      expect(env.users.writes).toEqual([]);
      expect(env.posts.writes).toEqual([]);
      expect(tx.Posts.count({})).toBe(3);
    });

    expect(env.users.snapshot()).toHaveLength(4);
    expect(env.posts.snapshot()[3]).toEqual([103, 3, "C post"]);
  });

  test("onDelete Cascade が tx 内で完結する", () => {
    const env = buildTxTestEnv({ relations: true, cascade: true });

    env.client.$transaction((tx) => {
      tx.Users.delete({ where: { id: 1 } });
      expect(tx.Posts.count({})).toBe(1);
      expect(env.users.writes).toEqual([]);
      expect(env.posts.writes).toEqual([]);
    });

    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [2, "Bob", 30],
    ]);
    expect(env.posts.snapshot()).toEqual([
      ["id", "authorId", "title"],
      [102, 2, "Post B"],
    ]);
  });

  test("onUpdate Cascade が tx 内で完結する", () => {
    const env = buildTxTestEnv({ relations: true, cascade: true });

    env.client.$transaction((tx) => {
      tx.Users.update({ where: { id: 1 }, data: { id: 10 } });
      const post: any = tx.Posts.findFirst({ where: { id: 101 } });
      expect(post.authorId).toBe(10);
      expect(env.posts.writes).toEqual([]);
    });

    expect(env.posts.snapshot()[1]).toEqual([101, 10, "Post A"]);
  });
});

describe("$transaction の updateMany / deleteMany 束ね", () => {
  test("連続行の updateMany は tx 内でバッファされ flush で 1 回の setValues になる", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.updateMany({ data: { age: { increment: 1 } } });
      expect(env.users.writes).toEqual([]);
    });

    expect(env.users.writes).toEqual([
      {
        method: "setValues",
        args: [
          2,
          1,
          [
            [1, "Alice", 21],
            [2, "Bob", 31],
          ],
        ],
      },
    ]);
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 21],
      [2, "Bob", 31],
    ]);
  });

  test("updateMany の行別 increment 結果が tx 内読み取りに見える", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.updateMany({ data: { age: { increment: 1 } } });
      expect(tx.Users.findMany({})).toEqual([
        { id: 1, name: "Alice", age: 21 },
        { id: 2, name: "Bob", age: 31 },
      ]);
      expect(env.users.snapshot()).toEqual([
        ["id", "name", "age"],
        [1, "Alice", 20],
        [2, "Bob", 30],
      ]);
    });
  });

  test("連続行の deleteMany は tx 内でバッファされ flush で 1 回の deleteRows になる", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.deleteMany({});
      expect(tx.Users.count({})).toBe(0);
      expect(env.users.writes).toEqual([]);
    });

    expect(env.users.writes).toEqual([{ method: "deleteRows", args: [2, 2] }]);
    expect(env.users.snapshot()).toEqual([["id", "name", "age"]]);
  });

  test("deleteMany 後に create しても flush の発行順再生で行位置が一致する", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.deleteMany({ where: { id: 1 } });
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      expect(tx.Users.findMany({})).toEqual([
        { id: 2, name: "Bob", age: 30 },
        { id: 3, name: "Carol", age: 40 },
      ]);
    });

    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [2, "Bob", 30],
      [3, "Carol", 40],
    ]);
  });
});

describe("$transaction の autoincrement", () => {
  test("tx 内で即時採番され戻り値に入る", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    const key = "gassma_autoincrement_tx-test_Users_id";

    env.client.$transaction((tx) => {
      const created: any = tx.Users.create({
        data: { name: "Carol", age: 40 },
      });
      expect(created.id).toBe(1);
      expect(env.propsStore[key]).toBe("1");
      expect(env.users.writes).toEqual([]);
    });

    expect(env.users.snapshot()[3]).toEqual([1, "Carol", 40]);
  });

  test("fn throw でもシーケンスは巻き戻らない", () => {
    const env = buildTxTestEnv({ autoincrement: true });
    const key = "gassma_autoincrement_tx-test_Users_id";

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { name: "Carol", age: 40 } });
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(env.propsStore[key]).toBe("1");
    expect(env.users.snapshot()).toHaveLength(3);
  });

  test("tx 内の採番で lock は取り直されず tx 終了まで解放されない", () => {
    const env = buildTxTestEnv({ autoincrement: true });

    env.client.$transaction((tx) => {
      tx.Users.create({ data: { name: "Carol", age: 40 } });
      expect(env.waitLock).toHaveBeenCalledTimes(1);
      expect(env.releaseLock).not.toHaveBeenCalled();
      expect(env.hasLock()).toBe(true);
    });

    expect(env.waitLock).toHaveBeenCalledTimes(1);
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("tx 内の createMany の採番でも lock は解放されない", () => {
    const env = buildTxTestEnv({ autoincrement: true });

    env.client.$transaction((tx) => {
      tx.Users.createMany({
        data: [
          { name: "Carol", age: 40 },
          { name: "Dave", age: 50 },
        ],
      });
      expect(env.releaseLock).not.toHaveBeenCalled();
    });

    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });
});

describe("$transaction が使う lock", () => {
  test("client に渡した lock を使う", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => tx.Users.count({}));

    expect(env.lock.waitLock).toBe(env.waitLock);
    expect(env.waitLock).toHaveBeenCalledTimes(1);
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("lock を渡していない client では fn を呼ばずに失敗する", () => {
    const env = buildTxTestEnv({ noLock: true });
    const fn = jest.fn();

    expect(() => env.client.$transaction(fn)).toThrow(
      GassmaTransactionLockRequiredError,
    );
    expect(fn).not.toHaveBeenCalled();
    expect(env.users.writes).toEqual([]);
  });
});

describe("$transaction のエラー", () => {
  test("maxWait 超過で GassmaTransactionLockTimeoutError", () => {
    const env = buildTxTestEnv({ waitLockError: true });
    const fn = jest.fn();

    expect(() => env.client.$transaction(fn, { maxWait: 500 })).toThrow(
      GassmaTransactionLockTimeoutError,
    );
    expect(() => env.client.$transaction(fn, { maxWait: 500 })).toThrow(
      "Transaction API error: Unable to start a transaction in the given time.",
    );
    expect(fn).not.toHaveBeenCalled();
    expect(env.waitLock).toHaveBeenCalledWith(500);
    expect(env.releaseLock).not.toHaveBeenCalled();
  });

  test("maxWait / timeout の既定値は 20000 / 60000", () => {
    const env = buildTxTestEnv();
    let now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);

    env.client.$transaction((tx) => {
      now = 59999;
      expect(() => tx.Users.count({})).not.toThrow();
    });

    expect(env.waitLock).toHaveBeenCalledWith(20000);
  });

  test("timeout 超過後の tx メソッドは GassmaTransactionTimeoutError", () => {
    const env = buildTxTestEnv();
    let now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    let queryError: unknown = null;

    expect(() =>
      env.client.$transaction(
        (tx) => {
          tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
          now = 1500;
          try {
            tx.Users.findMany({});
          } catch (e) {
            queryError = e;
            throw e;
          }
        },
        { timeout: 1000 },
      ),
    ).toThrow(GassmaTransactionTimeoutError);

    expect(queryError).toBeInstanceOf(GassmaTransactionTimeoutError);
    expect(String((queryError as Error).message)).toBe(
      "Transaction API error: A query cannot be executed on an expired transaction. The timeout for this transaction was 1000 ms, however 1500 ms passed since the start of the transaction. Consider increasing the transaction timeout or doing less work in the transaction.",
    );
    expect(env.users.writes).toEqual([]);
    expect(env.users.snapshot()).toHaveLength(3);
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("flush 開始前の timeout 超過ではクリーンに中断される", () => {
    const env = buildTxTestEnv();
    let now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);

    expect(() =>
      env.client.$transaction(
        (tx) => {
          tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
          now = 2000;
        },
        { timeout: 1000 },
      ),
    ).toThrow(
      "Transaction API error: A commit cannot be executed on an expired transaction. The timeout for this transaction was 1000 ms, however 2000 ms passed since the start of the transaction. Consider increasing the transaction timeout or doing less work in the transaction.",
    );

    expect(env.users.writes).toEqual([]);
    expect(env.users.snapshot()).toHaveLength(3);
    expect(env.releaseLock).toHaveBeenCalledTimes(1);
  });

  test("tx 内で元 client の $transaction を呼ぶと GassmaNestedTransactionError", () => {
    const env = buildTxTestEnv();

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.count({});
        env.client.$transaction(() => null);
      }),
    ).toThrow(GassmaNestedTransactionError);

    expect(env.users.writes).toEqual([]);
  });

  test("tx client の $transaction 呼び出しも GassmaNestedTransactionError", () => {
    const env = buildTxTestEnv();

    expect(() =>
      env.client.$transaction((tx) => {
        (tx as any).$transaction(() => null);
      }),
    ).toThrow(GassmaNestedTransactionError);
  });

  test("エラー後は再び $transaction を開始できる", () => {
    const env = buildTxTestEnv();

    expect(() =>
      env.client.$transaction(() => {
        throw new Error("boom");
      }),
    ).toThrow("boom");

    const result = env.client.$transaction((tx) => {
      tx.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      return tx.Users.count({});
    });

    expect(result).toBe(3);
    expect(env.users.snapshot()).toHaveLength(4);
  });
});

describe("$transaction と $extends", () => {
  test("tx client の $extends 経由でもバッファされる", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      const extended = tx.$extends({
        result: {
          Users: {
            label: {
              needs: { name: true },
              compute: (record: any) => `user:${record.name}`,
            },
          },
        },
      });
      extended.Users.create({ data: { id: 3, name: "Carol", age: 40 } });
      expect(env.users.writes).toEqual([]);
      const found: any = extended.Users.findFirst({ where: { id: 3 } });
      expect(found.label).toBe("user:Carol");
    });

    expect(env.users.snapshot()).toHaveLength(4);
  });
});
