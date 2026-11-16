import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import editorial from "@/assets/collection-editorial.jpg";
import accessories from "@/assets/accessories-editorial.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "About U M Collection | Women's Fashion & Style" },
    { name: "description", content: "Meet U M Collection: women's suits, dresses, handbags, jewellery, watches and accessories." },
    { property: "og:title", content: "About U M Collection | Women's Fashion & Style" },
    { property: "og:description", content: "Discover U M Collection and explore our clothing and accessories collections." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
  ] }), component: CollectionHome,
});

function CollectionHome() {
  return <main>
    <section className="relative h-[520px] overflow-hidden bg-ink md:h-[560px]">
      <img src={editorial} alt="AI fashion editorial of emerald and rose embroidered suits" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 size-full object-cover object-[65%_center] md:object-center" />
      <div className="absolute inset-0 bg-ink/45 md:bg-ink/10" />
      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-center px-5 text-paper sm:px-8 lg:px-14">
        <p className="mb-5 text-xs text-gold">Style for every side of you</p>
        <h1 className="max-w-md font-display text-6xl leading-none sm:text-7xl">U M Collection</h1>
        <p className="mt-5 max-w-xs text-sm leading-6 text-paper/90">Beautiful suits. Thoughtful details.<br />A collection to make your own.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Button asChild className="rounded-none"><Link to="/suits">Explore suits <ArrowRight /></Link></Button><Button asChild variant="outline" className="rounded-none border-paper/60 bg-ink/30 text-paper hover:bg-ink/60 hover:text-paper"><Link to="/accessories">Bags & accessories</Link></Button></div>
      </div>
      <span className="absolute bottom-4 right-5 text-[10px] text-paper/75">AI style inspiration</span>
    </section>
    <section className="mx-auto grid max-w-[1440px] gap-5 px-5 py-12 sm:px-8 md:grid-cols-2 md:gap-12 lg:px-14">
      <div><p className="mb-3 text-xs text-muted-foreground">A little something special</p><h2 className="font-display text-4xl sm:text-5xl">About U M Collection</h2></div>
      <div className="max-w-xl space-y-4 text-sm leading-7 text-muted-foreground"><p>U M Collection brings together women's suits, dresses and the finishing touches that make an outfit feel yours.</p><p>From embroidered occasion wear to everyday clothing, discover our collection alongside handbags, jewellery, shoes and watches.</p></div>
    </section>
    <section className="border-t border-border px-5 py-12 sm:px-8 lg:px-14"><div className="mx-auto max-w-[1328px]"><h2 className="mb-7 font-display text-4xl">Two collections. Your style.</h2><div className="grid gap-8 md:grid-cols-2">
      <Link to="/suits" className="group"><div className="relative aspect-[4/3] overflow-hidden bg-secondary"><img src={editorial} alt="AI-inspired traditional women's suits" width={1536} height={1024} loading="lazy" className="size-full object-cover object-right" /><span className="absolute bottom-3 right-3 bg-background/90 px-2 py-1 text-[10px]">AI style inspiration</span></div><div className="mt-4 flex items-center justify-between"><h3 className="font-display text-3xl">Suits & clothing</h3><ArrowUpRight className="size-5" /></div><p className="mt-2 text-sm text-muted-foreground">Suits, dresses & loungewear</p></Link>
      <Link to="/accessories" className="group"><div className="relative aspect-[4/3] overflow-hidden bg-secondary"><img src={accessories} alt="AI accessories editorial with handbag, pearl earrings and gold watch" width={1024} height={1024} loading="lazy" className="size-full object-cover" /><span className="absolute bottom-3 right-3 bg-background/90 px-2 py-1 text-[10px]">AI style inspiration</span></div><div className="mt-4 flex items-center justify-between"><h3 className="font-display text-3xl">Bags & accessories</h3><ArrowUpRight className="size-5" /></div><p className="mt-2 text-sm text-muted-foreground">Handbags, jewellery, shoes & watches</p></Link>
    </div></div></section>
  </main>;
}
