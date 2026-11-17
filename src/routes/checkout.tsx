import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, formatPrice } from "@/lib/store-data";
import { shippingFor } from "@/lib/cart";
import { useAuthUser } from "@/hooks/use-role";
import { useCartLines } from "./cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [
    { title: "Checkout | U M Collection" }, { name: "description", content: "Complete your U M Collection order with cash on delivery." },
    { property: "og:title", content: "Checkout | U M Collection" }, { property: "og:description", content: "Complete your order." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, lines, subtotal } = useCartLines();
  const { data: settings } = useQuery(settingsQuery);
  const { data: user } = useAuthUser();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", notes: "" });
  const [code, setCode] = useState(""); const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState<string | null>(null);
  const discount = coupon?.discount ?? 0;
  const ship = shippingFor(subtotal, settings);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function applyCode() {
    if (!code.trim()) return;
    const { data, error } = await supabase.rpc("coupon_discount", { _code: code, _subtotal: subtotal });
    if (error) { setCoupon(null); toast.error(error.message); return; }
    setCoupon({ code: code.trim().toUpperCase(), discount: Number(data) }); toast.success("Coupon applied");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.rpc("checkout", {
      _name: form.name, _phone: form.phone, _email: form.email || user?.email || "", _address: [form.address, form.city].filter(Boolean).join(", "), _notes: form.notes,
      _items: lines.map(l => ({ product_id: l.product_id, quantity: l.quantity, variant: l.variant })), _coupon: coupon?.code ?? "",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    cart.clear(); qc.invalidateQueries({ queryKey: ["products"] }); setDone(String(data));
  }
  if (done) return <main className="mx-auto max-w-lg px-5 py-24 text-center"><CheckCircle2 className="mx-auto size-12 text-primary" /><h1 className="mt-4 font-display text-5xl">Thank you!</h1><p className="mt-3 text-sm text-muted-foreground">Your order has been placed. We'll call you to confirm before delivery. Please keep cash ready when it arrives.</p>
    <div className="mt-6 flex justify-center gap-2">{user && <Button asChild variant="outline" className="rounded-none"><Link to="/account">View my orders</Link></Button>}<Button asChild className="rounded-none"><Link to="/">Continue shopping</Link></Button></div></main>;
  if (lines.length === 0) return <main className="py-24 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Button asChild variant="link"><Link to="/shop">Start shopping</Link></Button></main>;
  return <main className="mx-auto max-w-5xl px-5 py-12">
    <h1 className="font-display text-5xl">Checkout</h1>
    {!user && <p className="mt-2 text-sm text-muted-foreground">Checking out as a guest. <Link to="/auth" search={{ redirect: "/checkout" }} className="underline">Sign in</Link> to track your orders.</p>}
    <form onSubmit={submit} className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="c-name">Full name</Label><Input id="c-name" required maxLength={120} value={form.name} onChange={set("name")} /></div><div><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" required maxLength={40} value={form.phone} onChange={set("phone")} /></div></div>
        <div><Label htmlFor="c-email">Email (optional)</Label><Input id="c-email" type="email" maxLength={200} value={form.email} onChange={set("email")} placeholder={user?.email ?? ""} /></div>
        <div><Label htmlFor="c-address">Street address</Label><Textarea id="c-address" required maxLength={400} value={form.address} onChange={set("address")} /></div>
        <div><Label htmlFor="c-city">City</Label><Input id="c-city" required maxLength={80} value={form.city} onChange={set("city")} /></div>
        <div><Label htmlFor="c-notes">Order notes (optional)</Label><Textarea id="c-notes" maxLength={1000} value={form.notes} onChange={set("notes")} /></div>
        <div className="border border-border p-4 text-sm"><p className="font-medium">Payment</p><p className="mt-1 text-muted-foreground">Cash on delivery</p></div>
      </div>
      <aside className="h-fit space-y-3 bg-secondary p-5 text-sm">
        {lines.map(l => <div key={l.key} className="flex justify-between gap-2"><span>{l.product!.name} × {l.quantity}</span><span>{formatPrice(Number(l.product!.price) * l.quantity)}</span></div>)}
        <div className="flex gap-2 border-t border-border pt-3"><Input aria-label="Coupon code" placeholder="Coupon code" value={code} onChange={e => setCode(e.target.value)} className="bg-background" /><Button type="button" variant="outline" onClick={applyCode}>Apply</Button></div>
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-primary"><span>Discount ({coupon!.code})</span><span>−{formatPrice(discount)}</span></div>}
        <div className="flex justify-between"><span>Shipping</span><span>{ship ? formatPrice(ship) : "Free"}</span></div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-medium"><span>Total</span><span>{formatPrice(Math.max(0, subtotal - discount) + ship)}</span></div>
        <Button type="submit" disabled={busy} className="w-full rounded-none">{busy ? "Placing order…" : "Place order"}</Button>
      </aside>
    </form>
  </main>;
}
