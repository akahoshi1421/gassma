import { findManyFunc } from "../../../util/find/findMany";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

// シート順: Alice, Bob, Charlie, David, Eve, Frank, Grace, Henry
// 住所: Tokyo, Osaka, Tokyo, Kyoto, Tokyo, Osaka, Tokyo, Kyoto
const rows = {
  Alice: {
    名前: "Alice",
    年齢: 28,
    住所: "Tokyo",
    郵便番号: "100-0001",
    職業: "Engineer",
  },
  Bob: {
    名前: "Bob",
    年齢: 35,
    住所: "Osaka",
    郵便番号: "550-0001",
    職業: "Designer",
  },
  Charlie: {
    名前: "Charlie",
    年齢: 22,
    住所: "Tokyo",
    郵便番号: "100-0002",
    職業: "Student",
  },
  David: {
    名前: "David",
    年齢: 45,
    住所: "Kyoto",
    郵便番号: "600-8000",
    職業: "Manager",
  },
  Eve: {
    名前: "Eve",
    年齢: 28,
    住所: "Tokyo",
    郵便番号: "100-0003",
    職業: "Engineer",
  },
  Frank: {
    名前: "Frank",
    年齢: 52,
    住所: "Osaka",
    郵便番号: "550-0002",
    職業: "Director",
  },
  Grace: {
    名前: "Grace",
    年齢: 31,
    住所: "Tokyo",
    郵便番号: "100-0004",
    職業: "Designer",
  },
  Henry: {
    名前: "Henry",
    年齢: 28,
    住所: "Kyoto",
    郵便番号: "600-8001",
    職業: "Engineer",
  },
};

// Prisma 実測 (7.4.1): orderBy → (take 負数は反転順で) cursor → distinct → skip → take → 正順出力
describe("findMany distinct の適用位置 (Prisma パリティ)", () => {
  const mockUtil = getExtendedMockControllerUtil();

  describe("従来挙動の維持 (cursor / take 負数なし)", () => {
    it("distinct 単独は正順の first occurrence を返す", () => {
      const result = findManyFunc(mockUtil, { distinct: ["住所"] });

      expect(result).toEqual([rows.Alice, rows.Bob, rows.David]);
    });

    it("distinct + skip は distinct 後に skip する", () => {
      const result = findManyFunc(mockUtil, { distinct: ["住所"], skip: 1 });

      expect(result).toEqual([rows.Bob, rows.David]);
    });

    it("distinct + take 正数は distinct 後に take する", () => {
      const result = findManyFunc(mockUtil, { distinct: ["住所"], take: 2 });

      expect(result).toEqual([rows.Alice, rows.Bob]);
    });
  });

  describe("distinct × cursor", () => {
    it("cursor 行の distinct キーが cursor より前に既出でも cursor 行から distinct する", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "Eve" },
        distinct: ["住所"],
      });

      expect(result).toEqual([rows.Eve, rows.Frank, rows.Henry]);
    });

    it("cursor → distinct → take の順で適用する", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "Eve" },
        distinct: ["住所"],
        take: 2,
      });

      expect(result).toEqual([rows.Eve, rows.Frank]);
    });

    it("cursor 後の distinct は skip より先に適用する", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "Alice" },
        distinct: ["住所"],
        skip: 1,
      });

      expect(result).toEqual([rows.Bob, rows.David]);
    });

    it("cursor が見つからない場合は distinct があっても空を返す", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "Zoe" },
        distinct: ["住所"],
      });

      expect(result).toEqual([]);
    });
  });

  describe("distinct × take 負数", () => {
    it("take 負数は反転順で distinct する (first occurrence が末尾側)", () => {
      const result = findManyFunc(mockUtil, {
        take: -2,
        distinct: ["住所"],
      });

      expect(result).toEqual([rows.Grace, rows.Henry]);
    });

    it("take 負数でも最終出力は正順に戻る", () => {
      const result = findManyFunc(mockUtil, {
        take: -3,
        distinct: ["住所"],
      });

      expect(result).toEqual([rows.Frank, rows.Grace, rows.Henry]);
    });

    it("take 負数 + skip は反転順で distinct → skip → take の順に適用する", () => {
      const result = findManyFunc(mockUtil, {
        take: -2,
        skip: 1,
        distinct: ["住所"],
      });

      expect(result).toEqual([rows.Frank, rows.Grace]);
    });

    it("orderBy 適用後の並びを反転して distinct する", () => {
      const result = findManyFunc(mockUtil, {
        orderBy: { 年齢: "asc" },
        take: -2,
        distinct: ["住所"],
      });

      expect(result).toEqual([rows.David, rows.Frank]);
    });

    it("take 負数 + cursor は反転順で cursor 位置決め後に distinct する", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "David" },
        take: -2,
        distinct: ["住所"],
      });

      expect(result).toEqual([rows.Charlie, rows.David]);
    });
  });

  describe("distinct なしの回帰確認", () => {
    it("cursor + take 負数は従来どおり cursor までの末尾 2 件を返す", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "Charlie" },
        take: -2,
      });

      expect(result).toEqual([rows.Bob, rows.Charlie]);
    });

    it("cursor 単独は cursor 行以降を返す", () => {
      const result = findManyFunc(mockUtil, {
        cursor: { 名前: "Frank" },
      });

      expect(result).toEqual([rows.Frank, rows.Grace, rows.Henry]);
    });
  });
});
