import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, settingsQuery, formatPrice, type Product } from "@/lib/store-data";

export function ProductCatalog({ categories }: { categories: string[] }) {
  const { data: all = [], isLoading, error } = useQuery(productsQuery);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const filtered = all.filter(p => p.categories && categories.includes(p.categories.slug) && `${p.name} ${p.categories.name}`.toLowerCase().includes(query.trim().toLowerCase()) && (!savedOnly || saved.includes(p.id)));
  return <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-14">
    <div className="flex items-center justify-end gap-2 border-b border-border pb-4">
      <label className="flex min-w-0 max-w-sm flex-1 items-center gap-2 border-b border-input"><Search className="size-4 shrink-0 text-muted-foreground" /><input aria-label="Search items" placeholder="Search the collection" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent py-2 text-sm outline-none" /></label>
      <Button variant={savedOnly ? "default" : "ghost"} size="icon" aria-label="Show favourites" aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Heart /></Button>
    </div>
    {error && <p className="py-10 text-center text-sm text-destructive">Couldn't load the collection. Please refresh.</p>}
    <p className="my-5 text-xs text-muted-foreground">{isLoading ? "Loading…" : `${filtered.length} pieces`}</p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
      {filtered.map(p => { const out = p.status === "out_of_stock" || p.stock <= 0; return <article key={p.id} className="min-w-0">
        <div className="relative aspect-[3/4] bg-secondary">
          <Button variant="ghost" onClick={() => setDetail(p)} aria-label={`View ${p.name}`} className="size-full rounded-none p-0 hover:bg-secondary"><img src={p.primary_image ?? p.images[0]} alt={p.image_alt ?? p.name} loading="lazy" className={`size-full object-contain ${out ? "opacity-50" : ""}`} /></Button>
          {out && <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[10px] text-paper">Out of stock</span>}
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 bg-background/95" aria-label={`${saved.includes(p.id) ? "Remove" : "Add"} ${p.name} favourite`} aria-pressed={saved.includes(p.id)} onClick={() => setSaved(s => s.includes(p.id) ? s.filter(n => n !== p.id) : [...s, p.id])}><Heart className={saved.includes(p.id) ? "fill-primary text-primary" : ""} /></Button>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">{p.categories?.name}</p><h2 className="mt-1 text-sm font-medium">{p.name}</h2>
        <p className="mt-1 text-sm">{Number(p.price) > 0 ? <>{formatPrice(p.price)}{p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && <s className="ml-2 text-xs text-muted-foreground">{formatPrice(p.compare_at_price)}</s>}</> : <span className="text-xs text-muted-foreground">Price on request</span>}</p>
      </article>; })}
    </div>
    {!isLoading && filtered.length === 0 && <div className="py-16 text-center"><h2 className="font-display text-3xl">No pieces found</h2><Button variant="link" onClick={() => { setQuery(""); setSavedOnly(false); }}>Show all pieces</Button></div>}
    {detail && <ProductDialog product={detail} onClose={() => setDetail(null)} />}
  </section>;
}

function ProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: settings } = useQuery(settingsQuery);
  const images = product.images.length ? product.images : [product.primary_image ?? ""];
  const [img, setImg] = useState(product.primary_image ?? images[0]);
  const [ordering, setOrdering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "", quantity: 1 });
  const out = product.status === "out_of_stock" || product.stock <= 0;
  const variants = Array.isArray(product.variants) ? (product.variants as { type: string; values: string[] }[]) : [];
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.rpc("place_order", { _name: form.name, _phone: form.phone, _email: form.email, _address: form.address, _notes: form.notes, _items: [{ product_id: product.id, quantity: form.quantity }] });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Order placed! We'll contact you to confirm.");
    qc.invalidateQueries({ queryKey: ["products"] }); onClose();
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={product.name} className="relative grid max-h-[92dvh] w-full max-w-4xl gap-6 overflow-auto bg-background p-5 md:grid-cols-2" onClick={e => e.stopPropagation()}>
      <Button variant="ghost" size="icon" aria-label="Close product" className="absolute right-3 top-3 z-10 bg-background" onClick={onClose}><X /></Button>
      <div><img src={img} alt={product.image_alt ?? product.name} className="h-[55dvh] w-full object-contain" />
        {images.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto">{images.map(u => <button key={u} onClick={() => setImg(u)} className={`size-14 shrink-0 border ${u === img ? "border-primary" : "border-border"}`}><img src={u} alt="" className="size-full object-cover" /></button>)}</div>}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{product.categories?.name}</p>
        <h2 className="mt-1 font-display text-4xl">{product.name}</h2>
        <p className="mt-2 text-lg">{Number(product.price) > 0 ? formatPrice(product.price) : "Price on request"}</p>
        {product.description && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>}
        {variants.map(v => <p key={v.type} className="mt-2 text-xs"><span className="text-muted-foreground">{v.type}: </span>{v.values.join(", ")}</p>)}
        {out ? <p className="mt-6 bg-secondary p-3 text-sm">This piece is currently out of stock.</p> : !ordering ? <Button className="mt-6 w-full rounded-none" onClick={() => setOrdering(true)}>Order now</Button> :
          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="o-name">Name</Label><Input id="o-name" required maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><Label htmlFor="o-phone">Phone</Label><Input id="o-phone" required maxLength={40} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div></div>
            <div><Label htmlFor="o-email">Email (optional)</Label><Input id="o-email" type="email" maxLength={200} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="o-address">Delivery address</Label><Textarea id="o-address" required maxLength={500} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="o-qty">Quantity</Label><Input id="o-qty" type="number" min={1} max={Math.min(20, product.stock)} value={form.quantity} onChange={e => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })} /></div><div><Label htmlFor="o-notes">Size / colour / notes</Label><Input id="o-notes" maxLength={1000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div></div>
            <p className="text-xs text-muted-foreground">Cash on delivery{settings?.delivery_time ? ` · Delivery in ${settings.delivery_time}` : ""}</p>
            <Button type="submit" disabled={busy} className="w-full rounded-none">{busy ? "Placing order…" : `Place order${Number(product.price) > 0 ? ` · ${formatPrice(Number(product.price) * form.quantity)}` : ""}`}</Button>
          </form>}
      </div>
    </div>
  </div>;
}
