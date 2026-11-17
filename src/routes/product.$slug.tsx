import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { productsQuery, settingsQuery, formatPrice } from "@/lib/store-data";
import { useCart, useWishlist } from "@/lib/cart";
import { shopifyProductsQuery } from "@/lib/shopify";
import { ShopifyDetail } from "@/components/shopify-detail";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return { meta: [
      { title: `${name} | U M Collection` },
      { name: "description", content: `Shop ${name} at U M Collection — women's fashion with cash on delivery.` },
      { property: "og:title", content: `${name} | U M Collection` },
      { property: "og:description", content: `Shop ${name} at U M Collection.` },
      { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: ProductPage,
});

const sizeChart = [["XS", "32", "26", "35"], ["S", "34", "28", "37"], ["M", "36", "30", "39"], ["L", "38", "32", "41"], ["XL", "40", "34", "43"]];

function ProductPage() {
  const { data: shopifyProducts = [], isPending: shopifyPending } = useQuery(shopifyProductsQuery);
  const { slug } = Route.useParams();
  const { data: all = [], isLoading } = useQuery(productsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const cart = useCart(); const wish = useWishlist();
  const product = all.find(p => p.slug === slug);
  const [img, setImg] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(false);
  const shopifyProduct = shopifyProducts.find(p => p.handle === slug);
  if (shopifyProduct) return <ShopifyDetail key={shopifyProduct.id} product={shopifyProduct} />;
  if (isLoading) return <main className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2"><Skeleton className="aspect-[3/4]" /><Skeleton className="h-60" /></main>;
  if (!product && shopifyPending) return <main className="px-5 py-12"><Skeleton className="h-60" /></main>;
  if (!product) return <main className="py-24 text-center"><h1 className="font-display text-4xl">Product not found</h1><Button asChild variant="link"><Link to="/shop">Back to the store</Link></Button></main>;
  const images = product.images.length ? product.images : [product.primary_image ?? ""];
  const current = img ?? product.primary_image ?? images[0];
  const variants = Array.isArray(product.variants) ? (product.variants as { type: string; values: string[] }[]).filter(v => v.values?.length) : [];
  const out = product.status === "out_of_stock" || product.stock <= 0;
  const priced = Number(product.price) > 0;
  const hasSize = variants.some(v => /size/i.test(v.type));
  const related = all.filter(p => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);
  function add() {
    const missing = variants.find(v => !picked[v.type]);
    if (missing) { toast.error(`Please choose a ${missing.type.toLowerCase()}`); return; }
    cart.add(product!.id, picked); toast.success("Added to cart", { action: { label: "View cart", onClick: () => location.assign("/cart") } });
  }
  return <main className="mx-auto max-w-6xl px-5 py-10">
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <button type="button" aria-label="Zoom image" onClick={() => setZoom(!zoom)} className={`block w-full overflow-hidden bg-secondary ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}>
          <img src={current} alt={product.image_alt ?? product.name} className={`aspect-[3/4] w-full object-contain transition-transform ${zoom ? "scale-150" : ""}`} />
        </button>
        {images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto">{images.map(u => <button key={u} type="button" onClick={() => setImg(u)} className={`size-16 shrink-0 border ${u === current ? "border-primary" : "border-border"}`}><img src={u} alt="" className="size-full object-cover" /></button>)}</div>}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{product.categories?.name}</p>
        <h1 className="mt-1 font-display text-5xl">{product.name}</h1>
        <p className="mt-3 text-xl">{priced ? <>{formatPrice(product.price)}{product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && <s className="ml-3 text-sm text-muted-foreground">{formatPrice(product.compare_at_price)}</s>}</> : "Price on request"}</p>
        <p className={`mt-2 text-xs ${out ? "text-destructive" : "text-muted-foreground"}`}>{out ? "Out of stock" : product.stock <= 3 ? `Only ${product.stock} left` : "In stock"}</p>
        {variants.map(v => <div key={v.type} className="mt-5"><p className="mb-2 text-xs">{v.type}{picked[v.type] ? `: ${picked[v.type]}` : ""}</p><div className="flex flex-wrap gap-2">{v.values.map(x => <Button key={x} type="button" size="sm" variant={picked[v.type] === x ? "default" : "outline"} className="rounded-none" onClick={() => setPicked({ ...picked, [v.type]: x })}>{x}</Button>)}</div></div>)}
        {hasSize && <Dialog><DialogTrigger asChild><Button variant="link" className="mt-1 px-0 text-xs">Size guide</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Size guide (inches)</DialogTitle></DialogHeader><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th>Size</th><th>Bust</th><th>Waist</th><th>Hips</th></tr></thead><tbody>{sizeChart.map(r => <tr key={r[0]} className="border-t border-border">{r.map(c => <td key={c} className="py-2">{c}</td>)}</tr>)}</tbody></table></DialogContent></Dialog>}
        <div className="mt-6 flex gap-2">
          <Button className="flex-1 rounded-none" disabled={out || !priced} onClick={add}><ShoppingBag /> {out ? "Out of stock" : priced ? "Add to cart" : "Price on request"}</Button>
          <Button variant="outline" size="icon" className="rounded-none" aria-label="Save to wishlist" aria-pressed={wish.has(product.id)} onClick={() => wish.toggle(product.id)}><Heart className={wish.has(product.id) ? "fill-primary text-primary" : ""} /></Button>
        </div>
        <Accordion type="single" collapsible defaultValue="desc" className="mt-6">
          <AccordionItem value="desc"><AccordionTrigger>Description</AccordionTrigger><AccordionContent className="whitespace-pre-line text-muted-foreground">{product.description || "Details coming soon."}</AccordionContent></AccordionItem>
          <AccordionItem value="care"><AccordionTrigger>Fabric & care</AccordionTrigger><AccordionContent className="text-muted-foreground">Gentle hand wash or dry clean. Iron on low heat. Store away from direct sunlight.</AccordionContent></AccordionItem>
          <AccordionItem value="ship"><AccordionTrigger>Shipping</AccordionTrigger><AccordionContent className="text-muted-foreground">Cash on delivery across Pakistan.{settings?.delivery_time ? ` Delivery in ${settings.delivery_time}.` : ""}{settings?.free_shipping_threshold ? ` Free shipping over ${formatPrice(settings.free_shipping_threshold)}.` : ""}</AccordionContent></AccordionItem>
        </Accordion>
      </div>
    </div>
    {related.length > 0 && <section className="mt-16"><h2 className="mb-6 font-display text-3xl">You may also like</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{related.map(p => <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} onClick={() => { setImg(null); setPicked({}); }}><img src={p.primary_image ?? p.images[0]} alt={p.name} loading="lazy" className="aspect-[3/4] w-full bg-secondary object-contain" /><p className="mt-2 text-sm">{p.name}</p></Link>)}</div></section>}
  </main>;
}
