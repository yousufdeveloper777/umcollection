import { createFileRoute } from "@tanstack/react-router";
import { ProductCatalog } from "@/components/product-catalog";
export const Route = createFileRoute("/loungewear")({
  head: () => ({ meta: [
    { title: "Loungewear | U M Collection" },
    { name: "description", content: "Relaxed everyday pieces. Explore U M Collection." },
    { property: "og:title", content: "Loungewear | U M Collection" },
    { property: "og:description", content: "Relaxed everyday pieces." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
  ] }), component: CatalogPage,
});
function CatalogPage() { return <main><div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-14"><p className="mb-3 text-xs text-muted-foreground">U M Collection</p><h1 className="font-display text-5xl sm:text-6xl">Loungewear</h1><p className="mt-4 text-sm text-muted-foreground">Relaxed everyday pieces.</p></div><ProductCatalog categories={["Loungewear"]} /></main>; }
