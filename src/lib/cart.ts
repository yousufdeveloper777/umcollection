import { useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-role";

export type CartItem = { key: string; product_id: string; quantity: number; variant: Record<string, string> };

function localStore<T>(name: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: T | undefined; let raw: string | null | undefined;
  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    const r = localStorage.getItem(name);
    if (r !== raw || cache === undefined) { raw = r; try { cache = r ? JSON.parse(r) as T : fallback; } catch { cache = fallback; } }
    return cache;
  };
  return {
    get: read,
    set(v: T) { localStorage.setItem(name, JSON.stringify(v)); listeners.forEach(l => l()); },
    use(): T { return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, read, () => fallback); },
  };
}

const EMPTY: CartItem[] = [];
const cartStore = localStore<CartItem[]>("um-cart", EMPTY);
const guestWish = localStore<string[]>("um-wishlist", []);

export const variantKey = (id: string, v: Record<string, string>) => `${id}|${Object.entries(v).sort().map(([k, x]) => `${k}=${x}`).join("&")}`;

export function useCart() {
  const items = cartStore.use();
  return {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    add(product_id: string, variant: Record<string, string> = {}, quantity = 1) {
      const key = variantKey(product_id, variant); const cur = cartStore.get();
      const ex = cur.find(i => i.key === key);
      cartStore.set(ex ? cur.map(i => i.key === key ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i) : [...cur, { key, product_id, variant, quantity }]);
    },
    setQty(key: string, q: number) { cartStore.set(cartStore.get().map(i => i.key === key ? { ...i, quantity: Math.max(1, Math.min(20, q)) } : i)); },
    remove(key: string) { cartStore.set(cartStore.get().filter(i => i.key !== key)); },
    clear() { cartStore.set([]); },
  };
}

/** Wishlist: saved to the account when signed in, otherwise kept on this device. */
export function useWishlist() {
  const { data: user } = useAuthUser();
  const guest = guestWish.use();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wishlist", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlists").select("product_id");
      if (error) throw error;
      const ids = data.map(r => r.product_id);
      const pending = guestWish.get().filter(id => !ids.includes(id));
      if (pending.length) { await supabase.from("wishlists").insert(pending.map(product_id => ({ product_id, user_id: user!.id }))); guestWish.set([]); return [...ids, ...pending]; }
      return ids;
    },
  });
  const ids = user ? q.data ?? [] : guest;
  return {
    ids, has: (id: string) => ids.includes(id),
    async toggle(id: string) {
      if (!user) { guestWish.set(guest.includes(id) ? guest.filter(x => x !== id) : [...guest, id]); return; }
      const { error } = ids.includes(id)
        ? await supabase.from("wishlists").delete().eq("product_id", id).eq("user_id", user.id)
        : await supabase.from("wishlists").insert({ product_id: id, user_id: user.id });
      if (error) toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  };
}

export function shippingFor(subtotal: number, s: { flat_rate?: number; free_shipping_threshold?: number } | undefined) {
  const free = Number(s?.free_shipping_threshold ?? 0);
  return free > 0 && subtotal >= free ? 0 : Number(s?.flat_rate ?? 0);
}
export function applyCoupon(subtotal: number, c: { discount_type: string; discount_value: number }) {
  const d = c.discount_type === "percentage" ? subtotal * Math.min(c.discount_value, 100) / 100 : c.discount_value;
  return Math.round(Math.min(subtotal, d) * 100) / 100;
}
