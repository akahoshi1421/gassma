import { findFirstFunc } from "../../../util/find/findFirst";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

// シート順: Alice, Bob, Charlie, David, Eve, Frank, Grace, Henry
describe("findFirst take/skip/distinct", () => {
  const mockUtil = getExtendedMockControllerUtil();

  describe("take", () => {
    it("take: 1 は先頭を返す", () => {
      const result = findFirstFunc(mockUtil, { take: 1 });

      expect(result).toEqual({
        名前: "Alice",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0001",
        職業: "Engineer",
      });
    });

    it("take: -1 は並びを反転して末尾を返す", () => {
      const result = findFirstFunc(mockUtil, { take: -1 });

      expect(result).toEqual({
        名前: "Henry",
        年齢: 28,
        住所: "Kyoto",
        郵便番号: "600-8001",
        職業: "Engineer",
      });
    });

    it("take: -1 は orderBy 適用後の並びを反転する", () => {
      const result = findFirstFunc(mockUtil, {
        orderBy: { 年齢: "asc" },
        take: -1,
      });

      expect(result).toEqual({
        名前: "Frank",
        年齢: 52,
        住所: "Osaka",
        郵便番号: "550-0002",
        職業: "Director",
      });
    });

    it("take: -1 は where で絞った結果の末尾を返す", () => {
      const result = findFirstFunc(mockUtil, {
        where: { 住所: "Tokyo" },
        take: -1,
      });

      expect(result).toEqual({
        名前: "Grace",
        年齢: 31,
        住所: "Tokyo",
        郵便番号: "100-0004",
        職業: "Designer",
      });
    });

    it("take: 2 はエラー", () => {
      expect(() => findFirstFunc(mockUtil, { take: 2 })).toThrow(
        "The 'findFirst' operation cannot be used with a 'take' argument that isn't 1 or -1",
      );
    });

    it("take: 0 はエラー", () => {
      expect(() => findFirstFunc(mockUtil, { take: 0 })).toThrow(
        "The 'findFirst' operation cannot be used with a 'take' argument that isn't 1 or -1",
      );
    });

    it("take: -2 はエラー", () => {
      expect(() => findFirstFunc(mockUtil, { take: -2 })).toThrow(
        "The 'findFirst' operation cannot be used with a 'take' argument that isn't 1 or -1",
      );
    });
  });

  describe("skip", () => {
    it("skip: 2 は 2 件飛ばした先頭を返す", () => {
      const result = findFirstFunc(mockUtil, { skip: 2 });

      expect(result).toEqual({
        名前: "Charlie",
        年齢: 22,
        住所: "Tokyo",
        郵便番号: "100-0002",
        職業: "Student",
      });
    });

    it("skip: 0 は先頭を返す", () => {
      const result = findFirstFunc(mockUtil, { skip: 0 });

      expect(result).toEqual({
        名前: "Alice",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0001",
        職業: "Engineer",
      });
    });

    it("skip が件数を超えると null を返す", () => {
      const result = findFirstFunc(mockUtil, { skip: 100 });

      expect(result).toBeNull();
    });

    it("skip: -1 はエラー", () => {
      expect(() => findFirstFunc(mockUtil, { skip: -1 })).toThrow(
        "Invalid value for skip argument: Value can only be positive, found: -1",
      );
    });

    it("orderBy 適用後に skip する", () => {
      const result = findFirstFunc(mockUtil, {
        orderBy: { 年齢: "desc" },
        skip: 1,
      });

      expect(result).toEqual({
        名前: "David",
        年齢: 45,
        住所: "Kyoto",
        郵便番号: "600-8000",
        職業: "Manager",
      });
    });

    it("where で絞った結果に skip する", () => {
      const result = findFirstFunc(mockUtil, {
        where: { 住所: "Tokyo" },
        skip: 3,
      });

      expect(result).toEqual({
        名前: "Grace",
        年齢: 31,
        住所: "Tokyo",
        郵便番号: "100-0004",
        職業: "Designer",
      });
    });

    it("take: -1 と skip を併用すると末尾側から skip する", () => {
      const result = findFirstFunc(mockUtil, { take: -1, skip: 1 });

      expect(result).toEqual({
        名前: "Grace",
        年齢: 31,
        住所: "Tokyo",
        郵便番号: "100-0004",
        職業: "Designer",
      });
    });

    it("take: -1 と件数超過の skip は null を返す", () => {
      const result = findFirstFunc(mockUtil, { take: -1, skip: 100 });

      expect(result).toBeNull();
    });
  });

  describe("distinct", () => {
    it("distinct 適用後の先頭を返す", () => {
      const result = findFirstFunc(mockUtil, { distinct: "住所" });

      expect(result).toEqual({
        名前: "Alice",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0001",
        職業: "Engineer",
      });
    });

    it("distinct 適用後に skip する（skip が先だと Charlie になる）", () => {
      const result = findFirstFunc(mockUtil, { distinct: "住所", skip: 2 });

      expect(result).toEqual({
        名前: "David",
        年齢: 45,
        住所: "Kyoto",
        郵便番号: "600-8000",
        職業: "Manager",
      });
    });

    it("distinct 適用後の件数を skip が超えると null を返す", () => {
      const result = findFirstFunc(mockUtil, { distinct: "住所", skip: 3 });

      expect(result).toBeNull();
    });

    it("distinct は配列で複数フィールドを指定できる", () => {
      const result = findFirstFunc(mockUtil, {
        distinct: ["住所", "職業"],
        skip: 6,
      });

      expect(result).toEqual({
        名前: "Henry",
        年齢: 28,
        住所: "Kyoto",
        郵便番号: "600-8001",
        職業: "Engineer",
      });
    });

    it("orderBy 適用後の並びで distinct する", () => {
      const result = findFirstFunc(mockUtil, {
        orderBy: { 年齢: "asc" },
        distinct: "住所",
        skip: 1,
      });

      expect(result).toEqual({
        名前: "Henry",
        年齢: 28,
        住所: "Kyoto",
        郵便番号: "600-8001",
        職業: "Engineer",
      });
    });

    it("take: -1 では反転後の並びで distinct する", () => {
      const result = findFirstFunc(mockUtil, {
        take: -1,
        distinct: "住所",
        skip: 2,
      });

      expect(result).toEqual({
        名前: "Frank",
        年齢: 52,
        住所: "Osaka",
        郵便番号: "550-0002",
        職業: "Director",
      });
    });
  });

  describe("cursor 併用", () => {
    it("cursor 位置決めの後に skip する", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 名前: "Charlie" },
        skip: 1,
      });

      expect(result).toEqual({
        名前: "David",
        年齢: 45,
        住所: "Kyoto",
        郵便番号: "600-8000",
        職業: "Manager",
      });
    });

    it("cursor + skip + take: 1 を併用できる", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 名前: "Charlie" },
        skip: 1,
        take: 1,
      });

      expect(result).toEqual({
        名前: "David",
        年齢: 45,
        住所: "Kyoto",
        郵便番号: "600-8000",
        職業: "Manager",
      });
    });

    it("take: -1 でも cursor 行自身を返す（inclusive）", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 名前: "Eve" },
        take: -1,
      });

      expect(result).toEqual({
        名前: "Eve",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0003",
        職業: "Engineer",
      });
    });

    it("take: -1 の cursor は反転後の並びで skip する", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 名前: "Eve" },
        take: -1,
        skip: 1,
      });

      expect(result).toEqual({
        名前: "David",
        年齢: 45,
        住所: "Kyoto",
        郵便番号: "600-8000",
        職業: "Manager",
      });
    });

    it("take: -1 の cursor は反転後の並びで最初に一致した行に位置決めする", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 職業: "Designer" },
        take: -1,
      });

      expect(result).toEqual({
        名前: "Grace",
        年齢: 31,
        住所: "Tokyo",
        郵便番号: "100-0004",
        職業: "Designer",
      });
    });

    it("cursor がミスした場合は skip があっても null を返す", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 名前: "Zoe" },
        skip: 1,
      });

      expect(result).toBeNull();
    });

    it("cursor 位置決めの後に distinct し、その後 skip する", () => {
      const result = findFirstFunc(mockUtil, {
        cursor: { 名前: "Bob" },
        distinct: "住所",
        skip: 1,
      });

      expect(result).toEqual({
        名前: "Charlie",
        年齢: 22,
        住所: "Tokyo",
        郵便番号: "100-0002",
        職業: "Student",
      });
    });
  });

  describe("select/omit 併用", () => {
    it("take: -1 と select を併用できる", () => {
      const result = findFirstFunc(mockUtil, {
        take: -1,
        select: { 名前: true },
      });

      expect(result).toEqual({ 名前: "Henry" });
    });

    it("skip と omit を併用できる", () => {
      const result = findFirstFunc(mockUtil, {
        skip: 1,
        omit: { 郵便番号: true, 職業: true },
      });

      expect(result).toEqual({ 名前: "Bob", 年齢: 35, 住所: "Osaka" });
    });
  });
});
