import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import editorial from "@/assets/collection-editorial.jpg";
import { FeaturedProducts } from "@/components/shopify-products";
import { categoriesQuery, contentQuery, productsQuery, type AboutContent, type HomeContent } from "@/lib/store-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "U M Collection | Elegant Women's Suits, Dresses & Accessories" },
    { name: "description", content: "Explore U M Collection for elegant women's suits, occasion dresses, handbags, jewellery and accessories. Discover pieces for everyday and special moments." },
    { property: "og:title", content: "U M Collection | Elegant Women's Suits, Dresses & Accessories" },
    { property: "og:description", content: "Elegant suits, dresses and thoughtful accessories from U M Collection." },
    { property: "og:url", content: "https://umcollection.lovable.app/" },
    { property: "og:image", content: "https://umcollection.lovable.app/collection-share.jpg" },
    { name: "twitter:image", content: "https://umcollection.lovable.app/collection-share.jpg" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
  ], links: [{ rel: "canonical", href: "https://umcollection.lovable.app/" }] }), component: CollectionHome,
});

function CollectionHome() {
  const { data: home = {} } = useQuery(contentQuery<HomeContent>("home"));
  const { data: about = {} } = useQuery(contentQuery<AboutContent>("about"));
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const featured = categories.filter(c => (home.featured_categories ?? ["suits", "bags"]).includes(c.slug));
  const cover = (slug: string, img: string | null) => img || products.find(p => p.categories?.slug === slug)?.primary_image || editorial;
  const cta = home.cta_link && home.cta_link.startsWith("/") ? home.cta_link : "/suits";
  return <main>
    <section className="relative h-[420px] overflow-hidden bg-ink md:h-[480px]">
      <img src={home.background_image || editorial} alt="U M Collection fashion editorial" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 size-full object-cover object-[65%_center] md:object-top" />
      <div className="absolute inset-0 bg-ink/45 md:bg-ink/10" />
      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-center px-5 text-paper sm:px-8 lg:px-14">
        <p className="mb-5 text-xs text-gold">{home.eyebrow ?? "Style for every side of you"}</p>
        <h1 className="max-w-md font-display text-6xl leading-none sm:text-7xl">{home.headline || "U M Collection"}</h1>
        <p className="mt-5 max-w-xs text-sm leading-6 text-paper/90">{home.subheadline ?? "Beautiful suits. Thoughtful details. A collection to make your own."}</p>
        <div className="mt-7 flex flex-wrap gap-3"><Button asChild className="rounded-none"><a href={cta}>{home.cta_text || "Explore suits"} <ArrowRight /></a></Button><Button asChild variant="outline" className="rounded-none border-paper/60 bg-ink/30 text-paper hover:bg-ink/60 hover:text-paper"><Link to="/accessories">Bags & accessories</Link></Button></div>
      </div>
    </section>
    <FeaturedProducts />
    <section className="mx-auto grid max-w-[1440px] gap-5 px-5 py-12 sm:px-8 md:grid-cols-2 md:gap-12 lg:px-14">
      <div><p className="mb-3 text-xs text-muted-foreground">A little something special</p><h2 className="font-display text-4xl sm:text-5xl">{about.title || "About U M Collection"}</h2></div>
      <div className="max-w-xl space-y-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{about.body}</div>
    </section>
    <section className="border-t border-border px-5 py-12 sm:px-8 lg:px-14"><div className="mx-auto max-w-[1328px]"><h2 className="mb-7 font-display text-4xl">Explore the collections</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{featured.map(c => <a key={c.id} href={`/${c.slug}`} className="group"><div className="aspect-[4/3] overflow-hidden bg-secondary"><img src={cover(c.slug, c.image_url)} alt={c.name} loading="lazy" className="size-full object-cover transition-transform group-hover:scale-105" /></div><div className="mt-4 flex items-center justify-between"><h3 className="font-display text-3xl">{c.name}</h3><ArrowUpRight className="size-5" /></div></a>)}</div>
      <div className="mt-10 flex flex-wrap gap-2">{categories.map(c => <Button key={c.id} asChild variant="outline" className="rounded-none"><a href={`/${c.slug}`}>{c.name}</a></Button>)}</div></div></section>
  </main>;
}
