import { findFirstFunc } from "../../../util/find/findFirst";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("findFirst cursor", () => {
  const mockUtil = getExtendedMockControllerUtil();

  it("cursor 行自身を返す（inclusive）", () => {
    const result = findFirstFunc(mockUtil, { cursor: { 名前: "Charlie" } });

    expect(result).toEqual({
      名前: "Charlie",
      年齢: 22,
      住所: "Tokyo",
      郵便番号: "100-0002",
      職業: "Student",
    });
  });

  it("orderBy なしはシート順で最初に一致した行を返す", () => {
    const result = findFirstFunc(mockUtil, { cursor: { 職業: "Designer" } });

    expect(result).toEqual({
      名前: "Bob",
      年齢: 35,
      住所: "Osaka",
      郵便番号: "550-0001",
      職業: "Designer",
    });
  });

  it("orderBy 適用後の並びで cursor を探す", () => {
    const result = findFirstFunc(mockUtil, {
      orderBy: { 年齢: "desc" },
      cursor: { 住所: "Tokyo" },
    });

    expect(result).toEqual({
      名前: "Grace",
      年齢: 31,
      住所: "Tokyo",
      郵便番号: "100-0004",
      職業: "Designer",
    });
  });

  it("where で絞った結果に cursor を適用する", () => {
    const result = findFirstFunc(mockUtil, {
      where: { 住所: "Tokyo" },
      cursor: { 名前: "Eve" },
    });

    expect(result).toEqual({
      名前: "Eve",
      年齢: 28,
      住所: "Tokyo",
      郵便番号: "100-0003",
      職業: "Engineer",
    });
  });

  it("cursor が一致しない場合は null を返す", () => {
    const result = findFirstFunc(mockUtil, { cursor: { 名前: "Zoe" } });

    expect(result).toBeNull();
  });

  it("複合 cursor が部分一致のみの場合は null を返す", () => {
    const result = findFirstFunc(mockUtil, {
      cursor: { 名前: "Alice", 年齢: 99 },
    });

    expect(result).toBeNull();
  });

  it("select と併用できる", () => {
    const result = findFirstFunc(mockUtil, {
      cursor: { 名前: "Bob" },
      select: { 名前: true },
    });

    expect(result).toEqual({ 名前: "Bob" });
  });

  it("omit と併用できる", () => {
    const result = findFirstFunc(mockUtil, {
      cursor: { 名前: "Bob" },
      omit: { 郵便番号: true, 職業: true },
    });

    expect(result).toEqual({ 名前: "Bob", 年齢: 35, 住所: "Osaka" });
  });
});
