import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shopifyProductsQuery, type ShopifyProduct } from "@/lib/shopify";
import { useShopifyCart } from "@/lib/shopify-cart";
import { Skeleton } from "@/components/ui/skeleton";

export function ShopifyProductCard({ product }: { product: ShopifyProduct }) {
  const variant = product.variants.edges[0]?.node;
  const { add, busy } = useShopifyCart();
  const options = product.options.some(option => option.name !== "Title" && option.values.length > 1);
  const photo = product.images.edges[0]?.node;
  return <article className="min-w-0"><Link to="/product/$slug" params={{ slug: product.handle }} className="block aspect-[3/4] overflow-hidden bg-secondary">{photo ? <img src={photo.url} alt={photo.altText || product.title} className="size-full object-contain" loading="lazy" /> : <ShoppingBag className="mx-auto h-full w-12 text-muted-foreground" />}</Link>
    <p className="mt-3 text-xs text-muted-foreground">{product.productType}</p><h2 className="mt-1 text-sm font-medium"><Link to="/product/$slug" params={{ slug: product.handle }}>{product.title}</Link></h2><p className="mt-2 text-sm">{variant ? `${variant.price.currencyCode} ${Number(variant.price.amount).toLocaleString()}` : "Unavailable"}</p>
    {options ? <Button asChild variant="outline" className="mt-3 w-full rounded-none"><Link to="/product/$slug" params={{ slug: product.handle }}>Choose size</Link></Button> : <Button className="mt-3 w-full rounded-none" disabled={!variant?.availableForSale || busy} onClick={() => { if (variant) void add(variant); }}><ShoppingBag />{variant?.availableForSale ? "Add to Cart" : "Out of stock"}</Button>}
  </article>;
}
export function FeaturedProducts() {
  const { data = [], isPending, isError } = useQuery(shopifyProductsQuery);
  return <section className="mx-auto max-w-[1440px] border-t border-border px-5 py-12 sm:px-8 lg:px-14"><div className="mb-7 flex items-center justify-between gap-3"><h2 className="font-display text-4xl">Featured Products</h2><Button asChild variant="link"><Link to="/shop">Shop all</Link></Button></div>
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{isPending ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />) : data.slice(0, 4).map(product => <ShopifyProductCard key={product.id} product={product} />)}</div>
    {!isPending && !data.length && <p className="border-y border-border py-10 text-sm text-muted-foreground">{isError ? "The collection couldn't load. Please try again shortly." : "No products found."}</p>}
  </section>;
}