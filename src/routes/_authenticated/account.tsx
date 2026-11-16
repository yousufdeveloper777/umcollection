import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/shared";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, formatPrice } from "@/lib/store-data";
import { useCart, useWishlist } from "@/lib/cart";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [
    { title: "My account | U M Collection" }, { name: "description", content: "Your U M Collection orders and wishlist." },
    { property: "og:title", content: "My account | U M Collection" }, { property: "og:description", content: "Your orders and wishlist." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: AccountPage,
});

const steps = ["pending", "processing", "shipped", "delivered"];

function AccountPage() {
  const { user, profile } = useRole();
  const qc = useQueryClient(); const navigate = useNavigate();
  const wish = useWishlist(); const cart = useCart();
  const { data: products = [] } = useQuery(productsQuery);
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id], enabled: !!user,
    queryFn: async () => { const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("customer_id", user!.id).order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  async function logout() { qc.clear(); await supabase.auth.signOut(); navigate({ to: "/" }); }
  const saved = products.filter(p => wish.has(p.id));
  return <main className="mx-auto max-w-4xl px-5 py-12">
    <div className="flex items-end justify-between gap-4"><div><h1 className="font-display text-5xl">My account</h1><p className="mt-1 text-sm text-muted-foreground">{profile?.full_name || user?.email}</p></div><Button variant="outline" size="sm" onClick={logout}><LogOut /> Log out</Button></div>
    <Tabs defaultValue="orders" className="mt-8">
      <TabsList><TabsTrigger value="orders">Orders</TabsTrigger><TabsTrigger value="wishlist">Wishlist ({saved.length})</TabsTrigger></TabsList>
      <TabsContent value="orders" className="space-y-4 pt-4">
        {!isLoading && orders.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No orders yet.</p>}
        {orders.map(o => { const idx = steps.indexOf(o.status); return <article key={o.id} className="border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">Order #{o.order_number}</p><StatusBadge status={o.status} /></div>
          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · {formatPrice(o.total)}</p>
          {o.status !== "cancelled" && <div className="mt-3 grid grid-cols-4 gap-1">{steps.map((s, i) => <div key={s}><div className={`h-1 ${i <= idx ? "bg-primary" : "bg-border"}`} /><p className="mt-1 text-[10px] capitalize text-muted-foreground">{s}</p></div>)}</div>}
          {o.tracking_number && <p className="mt-2 text-xs">Tracking number: {o.tracking_number}</p>}
          <ul className="mt-3 text-sm">{o.order_items.map(i => <li key={i.id}>{i.product_name} × {i.quantity}</li>)}</ul>
        </article>; })}
      </TabsContent>
      <TabsContent value="wishlist" className="pt-4">
        {saved.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Your wishlist is empty.</p> :
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{saved.map(p => <div key={p.id}><Link to="/product/$slug" params={{ slug: p.slug }}><img src={p.primary_image ?? p.images[0]} alt={p.name} className="aspect-[3/4] w-full bg-secondary object-contain" /><p className="mt-2 text-sm">{p.name}</p></Link>
          <div className="mt-2 flex gap-2"><Button size="sm" className="flex-1 rounded-none" disabled={p.stock <= 0 || Number(p.price) <= 0 || (Array.isArray(p.variants) && p.variants.length > 0)} onClick={() => { cart.add(p.id); void wish.toggle(p.id); }}>Move to cart</Button><Button size="sm" variant="outline" className="rounded-none" onClick={() => wish.toggle(p.id)}>Remove</Button></div></div>)}</div>}
      </TabsContent>
    </Tabs>
  </main>;
}
