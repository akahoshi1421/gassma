import type { QueryHookParams } from "../../../../types/extendsTypes";
import { buildTestClient, clearSpreadsheetApp } from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

const tap =
  (label: string, log: string[]) =>
  ({ args, query }: QueryHookParams) => {
    log.push(`${label}:in`);
    const result = query(args);
    log.push(`${label}:out`);
    return result;
  };

describe("$extends query: 複数拡張の連鎖", () => {
  test("先に適用した拡張が外側になる（Prisma 準拠）", () => {
    const client = buildTestClient();
    const log: string[] = [];
    const extended = client
      .$extends({ query: { Users: { findMany: tap("first", log) } } })
      .$extends({ query: { Users: { findMany: tap("second", log) } } });
    extended.Users.findMany({});
    expect(log).toEqual(["first:in", "second:in", "second:out", "first:out"]);
  });

  test("外側の args 改変を内側のフックが受け取る", () => {
    const client = buildTestClient();
    const seen: unknown[] = [];
    const extended = client
      .$extends({
        query: {
          Users: {
            findMany({ args, query }) {
              return query({ ...args, take: 1 });
            },
          },
        },
      })
      .$extends({
        query: {
          Users: {
            findMany({ args, query }) {
              seen.push(args);
              return query(args);
            },
          },
        },
      });
    const result = extended.Users.findMany({});
    expect(seen).toEqual([{ take: 1 }]);
    expect(result).toEqual([{ id: 1, name: "Alice", age: 20 }]);
  });

  test("内側（後から適用）の結果加工を外側が受け取る", () => {
    const client = buildTestClient();
    const extended = client
      .$extends({
        query: {
          Users: {
            findMany({ args, query }) {
              return { wrappedByFirst: query(args) };
            },
          },
        },
      })
      .$extends({
        query: {
          Users: {
            findMany({ args, query }) {
              return query(args).map(
                (row: Record<string, unknown>) => row.name,
              );
            },
          },
        },
      });
    expect(extended.Users.findMany({})).toEqual({
      wrappedByFirst: ["Alice", "Bob", "Carol"],
    });
  });

  test("中間クライアントは後段の $extends の影響を受けない", () => {
    const client = buildTestClient();
    const calls: string[] = [];
    const first = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            calls.push("first");
            return query(args);
          },
        },
      },
    });
    const second = first.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            calls.push("second");
            return query(args);
          },
        },
      },
    });
    first.Users.findMany({});
    expect(calls).toEqual(["first"]);
    calls.length = 0;
    second.Users.findMany({});
    expect(calls).toEqual(["first", "second"]);
  });

  test("同一ベースから独立した拡張クライアントを複数作れる", () => {
    const client = buildTestClient();
    const calls: string[] = [];
    const a = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            calls.push("a");
            return query(args);
          },
        },
      },
    });
    const b = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            calls.push("b");
            return query(args);
          },
        },
      },
    });
    a.Users.findMany({});
    expect(calls).toEqual(["a"]);
    calls.length = 0;
    b.Users.findMany({});
    expect(calls).toEqual(["b"]);
  });
});
