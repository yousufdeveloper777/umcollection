import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useShopifyCart } from "@/lib/shopify-cart";
import type { ShopifyProduct } from "@/lib/shopify";
export function ShopifyDetail({ product }: { product: ShopifyProduct }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string>();
  const { add, busy } = useShopifyCart();
  const options = product.options.filter(o => o.name !== "Title");
  const complete = options.every(o => selected[o.name]);
  const variant = product.variants.edges.find(({ node }) => node.selectedOptions.every(o => o.name === "Title" || selected[o.name] === o.value))?.node;
  const price = variant ?? product.variants.edges[0]?.node;
  return <main className="mx-auto max-w-6xl px-5 py-12"><div className="grid gap-10 md:grid-cols-2"><div><div className="aspect-[3/4] bg-secondary"><img src={image || product.images.edges[0]?.node.url} alt={product.title} className="size-full object-contain" /></div><div className="mt-3 flex gap-3 overflow-x-auto">{product.images.edges.map(({ node }) => <Button key={node.url} variant="outline" className="size-16 shrink-0 p-0" aria-label="View product photo" onClick={() => setImage(node.url)}><img src={node.url} alt={node.altText || product.title} className="size-full object-cover" /></Button>)}</div></div><div><p className="text-xs text-muted-foreground">{product.productType}</p><h1 className="mt-3 font-display text-5xl">{product.title}</h1><p className="mt-4 text-xl">{price && `${price.price.currencyCode} ${price.price.amount}`}</p><p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p>{options.map(option => <div key={option.name} className="mt-6"><p className="mb-3 text-sm">{option.name}</p><div className="flex flex-wrap gap-2">{option.values.map(value => <Button key={value} variant={selected[option.name] === value ? "default" : "outline"} aria-pressed={selected[option.name] === value} onClick={() => setSelected({ ...selected, [option.name]: value })}>{value}</Button>)}</div></div>)}<Button asChild variant="link" className="mt-3 px-0"><Link to="/size-guide">Size guide</Link></Button><Button className="mt-5 w-full rounded-none" disabled={busy || !complete || !variant?.availableForSale} onClick={() => { if (variant) void add(variant); }}>{!complete ? "Choose your size / options" : variant?.availableForSale ? "Add to Cart" : "Out of stock"}</Button><div className="mt-8 flex gap-6 border-t border-border pt-5 text-xs"><Link to="/shipping-returns">Shipping & Returns</Link><Link to="/contact">Ask a question</Link></div></div></div></main>;
}