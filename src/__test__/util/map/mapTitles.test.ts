import { mapTitles } from "../../../util/map/mapTitles";

describe("mapTitles", () => {
  it("シートヘッダーをコード名に変換する", () => {
    const titles = ["id", "total_amount", "status"];
    const mapping = { totalAmount: "total_amount" };
    expect(mapTitles(titles, mapping)).toEqual(["id", "totalAmount", "status"]);
  });

  it("複数のマッピングを同時に変換する", () => {
    const titles = ["id", "total_amount", "first_name", "status"];
    const mapping = { totalAmount: "total_amount", firstName: "first_name" };
    expect(mapTitles(titles, mapping)).toEqual([
      "id",
      "totalAmount",
      "firstName",
      "status",
    ]);
  });

  it("マッピングにないヘッダーはそのまま保持する", () => {
    const titles = ["id", "status", "role"];
    const mapping = { totalAmount: "total_amount" };
    expect(mapTitles(titles, mapping)).toEqual(["id", "status", "role"]);
  });

  it("空のマッピングならそのまま返す", () => {
    const titles = ["id", "total_amount"];
    expect(mapTitles(titles, {})).toEqual(["id", "total_amount"]);
  });

  it("元の配列を変更しない", () => {
    const titles = ["id", "total_amount"];
    const mapping = { totalAmount: "total_amount" };
    mapTitles(titles, mapping);
    expect(titles).toEqual(["id", "total_amount"]);
  });
});
