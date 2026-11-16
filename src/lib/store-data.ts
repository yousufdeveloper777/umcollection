import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Product = Tables<"products"> & { categories: { name: string; slug: string } | null };
export type HomeContent = { eyebrow?: string; headline?: string; subheadline?: string; cta_text?: string; cta_link?: string; background_image?: string; featured_categories?: string[] };
export type AboutContent = { title?: string; body?: string };
export type StoreSettings = { store_name?: string; contact_email?: string; phone?: string; address?: string; logo_url?: string; flat_rate?: number; free_shipping_threshold?: number; delivery_time?: string };

export const productsQuery = queryOptions({
  queryKey: ["products", "public"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*, categories(name, slug)").neq("status", "draft").order("created_at");
    if (error) throw error;
    return data as Product[];
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("display_order");
    if (error) throw error;
    return data;
  },
});

export const contentQuery = <T,>(key: "home" | "about") => queryOptions({
  queryKey: ["content", key],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_content").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return (data?.value ?? {}) as T;
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("data").eq("id", 1).maybeSingle();
    if (error) throw error;
    return (data?.data ?? {}) as StoreSettings;
  },
});

export const formatPrice = (n: number | string | null | undefined) => `Rs ${Number(n ?? 0).toLocaleString("en-PK")}`;
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
