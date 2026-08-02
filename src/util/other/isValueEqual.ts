import { isDateValue } from "./isDateValue";
import { toLookupKey } from "./toLookupKey";

const isValueEqual = (a: unknown, b: unknown): boolean => {
  if (isDateValue(a) && isDateValue(b)) {
    return a.getTime() === b.getTime();
  }
  return a === b;
};

// Invalid Date は getTime() が NaN で正規化キーが衝突するため参照そのものをキーにする
const toMembershipKey = (value: unknown): unknown =>
  isDateValue(value) && Number.isNaN(value.getTime())
    ? value
    : toLookupKey(value);

type MembershipEntry = { length: number; keys: Set<unknown> };

let membershipCache = new WeakMap<readonly unknown[], MembershipEntry>();

// フィルタパス起点で呼び、キャッシュ寿命を1パスに閉じる(パス跨ぎの stale 防止)
const resetMembershipCache = (): void => {
  membershipCache = new WeakMap();
};

const getMembershipKeys = (list: readonly unknown[]): Set<unknown> => {
  const cached = membershipCache.get(list);
  if (cached && cached.length === list.length) return cached.keys;
  const keys = new Set<unknown>();
  list.forEach((item) => {
    keys.add(toMembershipKey(item));
  });
  membershipCache.set(list, { length: list.length, keys });
  return keys;
};

const containsValue = (list: readonly unknown[], value: unknown): boolean =>
  getMembershipKeys(list).has(toMembershipKey(value));

export { containsValue, isValueEqual, resetMembershipCache };
