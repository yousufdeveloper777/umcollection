import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { productsQuery, formatPrice, type Product } from "@/lib/store-data";
import { useCart } from "@/lib/cart";
import { Skeleton } from "@/components/ui/skeleton";

export function StoreProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const options = Array.isArray(product.variants) && product.variants.some(v => v && typeof v === "object" && "values" in v && Array.isArray(v.values) && v.values.length > 0);
  const out = product.stock <= 0 || product.status === "out_of_stock";
  const priced = Number(product.price) > 0;
  return <article className="min-w-0"><Link to="/product/$slug" params={{ slug: product.slug }} className="block aspect-[3/4] overflow-hidden bg-secondary"><img src={product.primary_image ?? product.images[0]} alt={product.image_alt || product.name} className="size-full object-contain" loading="lazy" /></Link>
    <p className="mt-3 text-xs text-muted-foreground">{product.categories?.name}</p><h2 className="mt-1 text-sm font-medium"><Link to="/product/$slug" params={{ slug: product.slug }}>{product.name}</Link></h2><p className="mt-2 text-sm">{priced ? formatPrice(product.price) : "Price on request"}</p>
    {options && !out && priced ? <Button asChild variant="outline" className="mt-3 w-full rounded-none"><Link to="/product/$slug" params={{ slug: product.slug }}>Choose size</Link></Button> : <Button className="mt-3 w-full rounded-none" disabled={out || !priced} onClick={() => { cart.add(product.id); toast.success("Added to cart"); }}><ShoppingBag />{out ? "Out of stock" : "Add to Cart"}</Button>}
  </article>;
}
export function FeaturedProducts() {
  const { data = [], isPending, isError } = useQuery(productsQuery);
  return <section className="mx-auto max-w-[1440px] border-t border-border px-5 py-12 sm:px-8 lg:px-14"><div className="mb-7 flex items-center justify-between gap-3"><h2 className="font-display text-4xl">Featured Products</h2><Button asChild variant="link"><Link to="/shop">Shop all</Link></Button></div><div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{isPending ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />) : data.slice(0, 4).map(product => <StoreProductCard key={product.id} product={product} />)}</div>{!isPending && !data.length && <p className="py-10 text-sm text-muted-foreground">{isError ? "The collection couldn't load. Please try again shortly." : "No products found."}</p>}</section>;
}