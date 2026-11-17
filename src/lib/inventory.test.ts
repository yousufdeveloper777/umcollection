import { describe, expect, it } from "vitest";
import { parseInventoryCsv } from "./inventory";

describe("Inventory imports", () => {
  const ids = new Set(["p1"]);
  it("accepts a concrete stock quantity", () => expect(parseInventoryCsv("id,stock\np1,7", ids)).toEqual([{ id: "p1", stock: 7 }]));
  it.each(["-1", "1.5", "", "NaN"])("rejects invalid stock %s", stock => expect(() => parseInventoryCsv(`id,stock\np1,${stock}`, ids)).toThrow());
  it("rejects unknown products", () => expect(() => parseInventoryCsv("id,stock\np2,7", ids)).toThrow());
  it("rejects duplicate products", () => expect(() => parseInventoryCsv("id,stock\np1,7\np1,8", ids)).toThrow());
});