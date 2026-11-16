import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productsQuery, settingsQuery, formatPrice } from "@/lib/store-data";
import { shippingFor, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "Your cart | U M Collection" }, { name: "description", content: "Review the pieces in your U M Collection cart." },
    { property: "og:title", content: "Your cart | U M Collection" }, { property: "og:description", content: "Review your cart." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: CartPage,
});

export function useCartLines() {
  const cart = useCart();
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const lines = cart.items.map(i => ({ ...i, product: products.find(p => p.id === i.product_id) })).filter(l => l.product);
  const subtotal = lines.reduce((s, l) => s + Number(l.product!.price) * l.quantity, 0);
  return { cart, lines, subtotal, isLoading };
}

function CartPage() {
  const { cart, lines, subtotal, isLoading } = useCartLines();
  const { data: settings } = useQuery(settingsQuery);
  const ship = shippingFor(subtotal, settings);
  return <main className="mx-auto max-w-5xl px-5 py-12">
    <h1 className="font-display text-5xl">Your cart</h1>
    {!isLoading && lines.length === 0 ? <div className="py-16 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Button asChild className="mt-4 rounded-none"><Link to="/suits">Start shopping</Link></Button></div> :
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_300px]">
      <ul className="divide-y divide-border border-y border-border">{lines.map(l => <li key={l.key} className="flex gap-4 py-4">
        <img src={l.product!.primary_image ?? l.product!.images[0]} alt={l.product!.name} className="h-28 w-20 bg-secondary object-contain" />
        <div className="flex-1"><Link to="/product/$slug" params={{ slug: l.product!.slug }} className="font-medium">{l.product!.name}</Link>
          <p className="text-xs text-muted-foreground">{Object.entries(l.variant).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
          <p className="mt-1 text-sm">{formatPrice(l.product!.price)}</p>
          <div className="mt-2 flex items-center gap-1"><Button size="icon" variant="outline" className="size-8" aria-label="Decrease" onClick={() => cart.setQty(l.key, l.quantity - 1)}><Minus /></Button><span className="w-8 text-center text-sm">{l.quantity}</span><Button size="icon" variant="outline" className="size-8" aria-label="Increase" onClick={() => cart.setQty(l.key, Math.min(l.product!.stock, l.quantity + 1))}><Plus /></Button>
          <Button size="icon" variant="ghost" className="ml-auto" aria-label="Remove" onClick={() => cart.remove(l.key)}><Trash2 /></Button></div>
        </div></li>)}</ul>
      <aside className="h-fit space-y-2 bg-secondary p-5 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{ship ? formatPrice(ship) : "Free"}</span></div>
        <p className="text-xs text-muted-foreground">Coupon codes can be added at checkout.</p>
        <Button asChild className="mt-3 w-full rounded-none"><Link to="/checkout">Proceed to checkout</Link></Button>
      </aside>
    </div>}
  </main>;
}
