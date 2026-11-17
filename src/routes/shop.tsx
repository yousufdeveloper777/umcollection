import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/store-data";
import { pageHead } from "@/lib/page-head";
import { StoreProductCard } from "@/components/featured-products";
import { Skeleton } from "@/components/ui/skeleton";
export const Route = createFileRoute("/shop")({ head: () => pageHead("/shop", "Shop", "Shop elegant women's suits, dresses and accessories from U M Collection."), component: Shop });
function Shop() {
  const { data = [], isPending, error } = useQuery(productsQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const types = ["All", ...new Set(data.map(p => p.categories?.name).filter((name): name is string => !!name))];
  const products = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (category === "All" || p.categories?.name === category));
  return <main className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-14"><p className="text-xs text-muted-foreground">THE COLLECTION</p><h1 className="mt-2 font-display text-5xl">Shop U M Collection</h1><div className="my-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4"><div className="flex flex-wrap gap-2">{types.map(type => <Button key={type} variant={category === type ? "default" : "ghost"} onClick={() => setCategory(type)}>{type}</Button>)}</div><Input aria-label="Search products" placeholder="Search products" maxLength={100} className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">{isPending ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />) : products.map(p => <StoreProductCard key={p.id} product={p} />)}</div>
    {!isPending && !products.length && <div className="py-16 text-center"><h2 className="font-display text-3xl">{error ? "The shop is temporarily unavailable" : "No products found"}</h2><Button variant="link" onClick={() => { setSearch(""); setCategory("All"); }}>Reset filters</Button><Button asChild variant="link"><Link to="/suits">View collection previews</Link></Button></div>}
  </main>;
}