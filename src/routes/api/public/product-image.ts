import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { imagePathSchema, productImageUrl } from "@/lib/product-image";

export const Route = createFileRoute("/api/public/product-image")({
  server: { handlers: { GET: async ({ request }) => {
    const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
    const denied = () => new Response("Image unavailable", { status: 404, headers });
    const parsed = imagePathSchema.safeParse(new URL(request.url).searchParams.get("path"));
    if (!parsed.success) return denied();
    try {
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
      const url = process.env["SUPABASE_URL"];
      if (!key || !url) return denied();
      // Check visibility as anonymous, never via the service-role client.
      const publicClient = createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        } },
      });
      const image = productImageUrl(parsed.data);
      const [primary, gallery, category, home, settings] = await Promise.all([
        publicClient.from("products").select("id").neq("status", "draft").eq("primary_image", image).limit(1),
        publicClient.from("products").select("id").neq("status", "draft").contains("images", [image]).limit(1),
        publicClient.from("categories").select("id").eq("image_url", image).limit(1),
        publicClient.from("site_content").select("key").eq("key", "home").contains("value", { background_image: image }).limit(1),
        publicClient.from("store_settings").select("id").eq("id", 1).contains("data", { logo_url: image }).limit(1),
      ]);
      if (![primary, gallery, category, home, settings].some(result => !result.error && result.data?.length)) return denied();
      // The exact object is now authorized for public display; never return a storage bearer URL.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.storage.from("product-images").download(parsed.data);
      if (error || !data || !data.type.startsWith("image/")) return denied();
      return new Response(data, { headers: { ...headers, "Content-Type": data.type } });
    } catch {
      return denied();
    }
  } } },
});