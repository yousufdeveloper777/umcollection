import { createFileRoute } from "@tanstack/react-router";
import { ProductCatalog } from "@/components/product-catalog";
export const Route = createFileRoute("/suits")({
  head: () => ({ meta: [
    { title: "Suits & Clothing | U M Collection" },
    { name: "description", content: "From embroidered suits to dresses and relaxed everyday pieces. Explore U M Collection." },
    { property: "og:title", content: "Suits & Clothing | U M Collection" },
    { property: "og:description", content: "From embroidered suits to dresses and relaxed everyday pieces." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
  ] }), component: CatalogPage,
});
function CatalogPage() { return <main><div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-14"><p className="mb-3 text-xs text-muted-foreground">U M Collection</p><h1 className="font-display text-5xl sm:text-6xl">Suits & Clothing</h1><p className="mt-4 text-sm text-muted-foreground">From embroidered suits to dresses and relaxed everyday pieces.</p></div><ProductCatalog categories={["Suits", "Dresses", "Loungewear"]} /></main>; }
