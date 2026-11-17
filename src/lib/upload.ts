import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/product-image";

/** Store a revocable app URL, not a storage bearer capability. */
export async function uploadImage(file: File, folder = "products") {
  if (!["products", "categories", "content", "logo"].includes(folder)) throw new Error("Invalid image folder");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB");
  const filename = file.name.replace(/[^a-zA-Z0-9.]+/g, "-").replace(/\.{2,}/g, ".").replace(/^[^a-zA-Z0-9]+/, "").slice(0, 120) || "image";
  const path = `${folder}/${crypto.randomUUID()}-${filename}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return productImageUrl(path);
}
