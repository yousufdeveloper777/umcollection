import { useState } from "react";
import { Heart, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products, type Category, type Product } from "@/lib/products";

export function ProductCatalog({ categories }: { categories: Category[] }) {
  const [category, setCategory] = useState<Category | "All pieces">("All pieces");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const filtered = products.filter(p => categories.includes(p.category) && (category === "All pieces" || p.category === category) && `${p.name} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase()) && (!savedOnly || saved.includes(p.name)));
  return <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-14">
    <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 lg:flex-row">
      <div className="flex flex-wrap gap-1" aria-label="Filter by category">{(["All pieces", ...categories] as const).map(c => <Button key={c} variant={category === c ? "default" : "ghost"} size="sm" aria-pressed={category === c} onClick={() => setCategory(c)} className="rounded-none text-xs">{c}</Button>)}</div>
      <div className="flex items-center gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 border-b border-input"><Search className="size-4 shrink-0 text-muted-foreground" /><input aria-label="Search items" placeholder="Search the collection" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent py-2 text-sm outline-none" /></label><Button variant={savedOnly ? "default" : "ghost"} size="icon" aria-label="Show favourites" aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}><Heart /></Button></div>
    </div>
    <p className="my-5 text-xs text-muted-foreground">{filtered.length} pieces</p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{filtered.map(p => <article key={p.name} className="min-w-0">
      <div className="relative aspect-[3/4] bg-secondary"><Button variant="ghost" onClick={() => setDetail(p)} aria-label={`View ${p.name}`} className="size-full rounded-none p-0 hover:bg-secondary"><img src={p.image} alt={p.imageAlt} loading="lazy" className="size-full object-contain" /></Button><Button variant="ghost" size="icon" className="absolute right-2 top-2 bg-background/95" aria-label={`${saved.includes(p.name) ? "Remove" : "Add"} ${p.name} ${saved.includes(p.name) ? "from" : "to"} favourites`} aria-pressed={saved.includes(p.name)} onClick={() => setSaved(s => s.includes(p.name) ? s.filter(n => n !== p.name) : [...s,p.name])}><Heart className={saved.includes(p.name) ? "fill-primary text-primary" : ""} /></Button></div>
      <p className="mt-3 text-[10px] text-muted-foreground">{p.category}</p><h2 className="mt-1 text-sm font-medium">{p.name}</h2>
    </article>)}</div>
    {filtered.length === 0 && <div className="py-16 text-center"><h2 className="font-display text-3xl">No pieces found</h2><Button variant="link" onClick={() => {setQuery("");setCategory("All pieces");setSavedOnly(false);}}>Show all pieces</Button></div>}
    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setDetail(null)}><div role="dialog" aria-modal="true" aria-label={detail.name} className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-auto bg-background p-5" onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" aria-label="Close product" className="absolute right-3 top-3 bg-background" onClick={() => setDetail(null)}><X /></Button><img src={detail.image} alt={detail.imageAlt} className="h-[65dvh] w-full object-contain" /><h2 className="mt-4 font-display text-3xl">{detail.name}</h2><p className="mt-1 text-sm text-muted-foreground">{detail.category}</p></div></div>}
  </section>;
}
