import { describe, expect, it } from "vitest";
import { applyCoupon, shippingFor } from "./cart";
describe("pricing rules", () => {
  it("charges flat shipping below the free threshold", () => expect(shippingFor(1000, { flat_rate: 250, free_shipping_threshold: 5000 })).toBe(250));
  it("ships free at or above the threshold", () => expect(shippingFor(5000, { flat_rate: 250, free_shipping_threshold: 5000 })).toBe(0));
  it("percentage coupon takes a share of subtotal", () => expect(applyCoupon(2000, { discount_type: "percentage", discount_value: 10 })).toBe(200));
  it("fixed coupon never exceeds subtotal", () => expect(applyCoupon(300, { discount_type: "fixed", discount_value: 500 })).toBe(300));
});
