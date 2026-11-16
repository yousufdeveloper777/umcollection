import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { productsQuery, formatPrice } from "@/lib/store-data";
import { useWishlist } from "@/lib/cart";

export function ProductCatalog({ categories }: { categories: string[] }) {
  const { data: all = [], isLoading, error } = useQuery(productsQuery);
  const [query, setQuery] = useState("");
  const wish = useWishlist(); const saved = wish.ids;
  const [savedOnly, setSavedOnly] = useState(false);
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
          <Link to="/product/$slug" params={{ slug: p.slug }} aria-label={`View ${p.name}`} className="block size-full"><img src={p.primary_image ?? p.images[0]} alt={p.image_alt ?? p.name} loading="lazy" className={`size-full object-contain ${out ? "opacity-50" : ""}`} /></Link>
          {out && <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[10px] text-paper">Out of stock</span>}
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 bg-background/95" aria-label={`${saved.includes(p.id) ? "Remove" : "Add"} ${p.name} favourite`} aria-pressed={saved.includes(p.id)} onClick={() => wish.toggle(p.id)}><Heart className={saved.includes(p.id) ? "fill-primary text-primary" : ""} /></Button>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">{p.categories?.name}</p><h2 className="mt-1 text-sm font-medium"><Link to="/product/$slug" params={{ slug: p.slug }}>{p.name}</Link></h2>
        <p className="mt-1 text-sm">{Number(p.price) > 0 ? <>{formatPrice(p.price)}{p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && <s className="ml-2 text-xs text-muted-foreground">{formatPrice(p.compare_at_price)}</s>}</> : <span className="text-xs text-muted-foreground">Price on request</span>}</p>
      </article>; })}
    </div>
    {!isLoading && filtered.length === 0 && <div className="py-16 text-center"><h2 className="font-display text-3xl">No pieces found</h2><Button variant="link" onClick={() => { setQuery(""); setSavedOnly(false); }}>Show all pieces</Button></div>}
  </section>;
}
