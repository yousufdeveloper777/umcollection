import { z } from "zod";

export const imagePathSchema = z.string().max(240).regex(/^(products|categories|content|logo)\/[a-f0-9-]{36}-[a-zA-Z0-9][a-zA-Z0-9.-]*$/).refine(path => !path.includes(".."));
export function productImageUrl(path: string) {
  return `/api/public/product-image?path=${encodeURIComponent(imagePathSchema.parse(path))}`;
}
export function productImagePath(url: string | null | undefined) {
  if (!url?.startsWith("/api/public/product-image?")) return null;
  const path = new URL(url, "https://local.invalid").searchParams.get("path");
  const result = imagePathSchema.safeParse(path);
  return result.success ? result.data : null;
}