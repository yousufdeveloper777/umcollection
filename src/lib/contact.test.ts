import { describe, expect, it } from "vitest";
import { contactMailto, contactSchema } from "./contact";
describe("Contact enquiries", () => {
  it("rejects invalid emails and empty messages", () => {
    expect(contactSchema.safeParse({ name: "Ali", email: "invalid", message: "Hello" }).success).toBe(false);
    expect(contactSchema.safeParse({ name: "Ali", email: "ali@example.com", message: " " }).success).toBe(false);
  });
  it("rejects overlong messages", () => {
    expect(contactSchema.safeParse({ name: "Ali", email: "ali@example.com", message: "a".repeat(2001) }).success).toBe(false);
  });
  it("encodes enquiry text rather than injecting email headers", () => {
    const url = contactMailto("store@example.com", { name: "Ali & family", email: "ali@example.com", message: "Hello &bcc=other@example.com" });
    expect(url).toContain("%26bcc%3Dother%40example.com");
    expect(url).not.toContain("&bcc=");
  });
});