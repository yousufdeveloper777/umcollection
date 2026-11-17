import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { cartLineSchema, formatCheckoutUrl, mutateShopifyCart, readShopifyCart, type ShopifyCart, type ShopifyVariant } from "./shopify";

type Store = { cart: ShopifyCart | null; busy: boolean; add: (variant: ShopifyVariant, quantity?: number) => Promise<void>; update: (lineId: string, quantity: number) => Promise<void>; remove: (lineId: string) => Promise<void>; sync: () => Promise<void>; clear: () => void };
export const useShopifyCart = create<Store>()(persist((set, get) => {
  async function run(action: () => Promise<ShopifyCart | null>) {
    if (get().busy) return;
    set({ busy: true });
    try { const cart = await action(); set({ cart: cart?.totalQuantity ? { ...cart, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl) } : null }); }
    catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update your cart";
      if (/cart.*(not found|does not exist)/i.test(message)) set({ cart: null });
      toast.error(message);
    } finally { set({ busy: false }); }
  }
  return { cart: null, busy: false,
    add: async (variant, quantity = 1) => run(async () => {
      const line = cartLineSchema.parse({ merchandiseId: variant.id, quantity });
      const cart = get().cart;
      const existing = cart?.lines.edges.find(edge => edge.node.merchandise.id === variant.id)?.node;
      if (!cart) return mutateShopifyCart("cartCreate", { input: { lines: [line] } });
      if (existing) return mutateShopifyCart("cartLinesUpdate", { cartId: cart.id, lines: [{ id: existing.id, quantity: Math.min(20, existing.quantity + quantity) }] });
      return mutateShopifyCart("cartLinesAdd", { cartId: cart.id, lines: [line] });
    }),
    update: async (lineId, quantity) => {
      if (quantity <= 0) return get().remove(lineId);
      const cart = get().cart; if (!cart) return;
      return run(() => mutateShopifyCart("cartLinesUpdate", { cartId: cart.id, lines: [{ id: lineId, quantity: Math.min(20, Math.max(1, quantity)) }] }));
    },
    remove: async lineId => { const cart = get().cart; if (!cart) return; return run(() => mutateShopifyCart("cartLinesRemove", { cartId: cart.id, lineIds: [lineId] })); },
    sync: async () => { const cart = get().cart; if (!cart) return; return run(() => readShopifyCart(cart.id)); },
    clear: () => set({ cart: null }),
  };
}, { name: "um-shopify-cart", partialize: state => ({ cart: state.cart }), skipHydration: true }));
export function useCartSync() {
  useEffect(() => {
    void useShopifyCart.persist.rehydrate();
    void useShopifyCart.getState().sync();
    const sync = () => { if (document.visibilityState === "visible") void useShopifyCart.getState().sync(); };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
}