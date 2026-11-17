import { describe, expect, it } from "vitest";
import { canAccessAdmin, csvCell, isLowStock } from "./admin-permissions";

describe("Admin access", () => {
  it("allows an active super admin", () => expect(canAccessAdmin(["super_admin"], true)).toBe(true));
  it.each(["customer", "manager", "viewer"])("denies %s admin access", role => expect(canAccessAdmin([role], true)).toBe(false));
  it("denies deactivated super admins", () => expect(canAccessAdmin(["super_admin"], false)).toBe(false));
});
describe("Inventory thresholds", () => {
  it("uses the product threshold", () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
});
describe("Safe CSV export", () => {
  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=1+1")).toBe('"\'=1+1"');
    expect(csvCell("Product")).toBe('"Product"');
  });
});