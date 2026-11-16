import { createFileRoute } from "@tanstack/react-router";
import { ProductCatalog } from "@/components/product-catalog";
export const Route = createFileRoute("/shoes")({
  head: () => ({ meta: [
    { title: "Shoes | U M Collection" },
    { name: "description", content: "Heels and footwear to complete the outfit. Explore U M Collection." },
    { property: "og:title", content: "Shoes | U M Collection" },
    { property: "og:description", content: "Heels and footwear to complete the outfit." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
  ] }), component: CatalogPage,
});
function CatalogPage() { return <main><div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-14"><p className="mb-3 text-xs text-muted-foreground">U M Collection</p><h1 className="font-display text-5xl sm:text-6xl">Shoes</h1><p className="mt-4 text-sm text-muted-foreground">Heels and footwear to complete the outfit.</p></div><ProductCatalog categories={["shoes"]} /></main>; }
