import { describe, expect, it, vi, beforeEach } from "vitest";
import { imagePathSchema, productImagePath, productImageUrl } from "./product-image";

const storage = vi.hoisted(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: () => storage } } }));
import { uploadImage } from "./upload";
const path = "products/550e8400-e29b-41d4-a716-446655440000-photo.jpg";
describe("Revocable product images", () => {
  beforeEach(() => { vi.clearAllMocks(); storage.upload.mockResolvedValue({ error: null }); });
  it("round trips a same-origin image reference without a token", () => {
    const url = productImageUrl(path);
    expect(productImagePath(url)).toBe(path);
    expect(url).not.toContain("token=");
  });
  it.each(["../secret", "products/../../secret", "private/file.jpg", path + "?token=x", path + "/x"])("rejects unsafe path %s", value => {
    expect(imagePathSchema.safeParse(value).success).toBe(false);
  });
  it("does not interpret external URLs as local storage references", () => {
    expect(productImagePath("https://example.com" + productImageUrl(path))).toBeNull();
  });
  it("uploads without minting a signed URL", async () => {
    const url = await uploadImage(new File(["photo"], "photo.jpg", { type: "image/jpeg" }));
    expect(productImagePath(url)).not.toBeNull();
    expect(storage.createSignedUrl).not.toHaveBeenCalled();
  });
});