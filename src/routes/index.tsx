import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Heart, Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import blackHandbag from "@/assets/black-handbag.jpeg.asset.json";
import burgundySuit from "@/assets/burgundy-suit.jpeg.asset.json";
import miniHandbags from "@/assets/mini-handbags.jpeg.asset.json";
import pearlJewellery from "@/assets/pearl-jewellery.jpeg.asset.json";
import walletPhoto from "@/assets/wallet.jpeg.asset.json";
import watchCollection from "@/assets/watch-collection.jpeg.asset.json";
import whiteChainHandbag from "@/assets/white-chain-handbag.jpeg.asset.json";

type Category = "Suits" | "Jewellery" | "Bags" | "Accessories";

type Product = {
  name: string;
  category: Category;
  image: string;
  imageAlt: string;
};

const products: Product[] = [
  {
    name: "Embroidered Suit",
    category: "Suits",
    image: burgundySuit.url,
    imageAlt: "Model wearing an ornate burgundy embroidered suit",
  },
  {
    name: "Pearl Jewellery Set",
    category: "Jewellery",
    image: pearlJewellery.url,
    imageAlt: "Pearl necklace and matching jewellery set",
  },
  {
    name: "Classic Handbag",
    category: "Bags",
    image: blackHandbag.url,
    imageAlt: "Structured black handbag",
  },
  {
    name: "Chain-Detail Handbag",
    category: "Bags",
    image: whiteChainHandbag.url,
    imageAlt: "White handbag with a decorative chain strap",
  },
  {
    name: "Mini Handbag Collection",
    category: "Bags",
    image: miniHandbags.url,
    imageAlt: "Collection of mini handbags in several colours",
  },
  {
    name: "Watch Collection",
    category: "Accessories",
    image: watchCollection.url,
    imageAlt: "Assorted watches arranged in a presentation box",
  },
  {
    name: "Everyday Wallet",
    category: "Accessories",
    image: walletPhoto.url,
    imageAlt: "Black patterned wallet",
  },
];

const categories: (Category | "All pieces")[] = [
  "All pieces",
  "Suits",
  "Jewellery",
  "Bags",
  "Accessories",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "U M Collection | Suits, Jewellery & Accessories" },
      {
        name: "description",
        content:
          "Explore elegant women's suits, jewellery, handbags and accessories at U M Collection.",
      },
      { property: "og:title", content: "U M Collection | Women's Fashion" },
      {
        property: "og:description",
        content: "A considered edit of women's suits, jewellery, handbags and accessories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: CollectionHome,
});

function CollectionHome() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All pieces");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favourites, setFavourites] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === "All pieces" || product.category === activeCategory;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        `${product.name} ${product.category}`.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  function toggleFavourite(productName: string) {
    setFavourites((current) =>
      current.includes(productName)
        ? current.filter((name) => name !== productName)
        : [...current, productName],
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="flex min-h-8 items-center justify-center bg-ink px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
        <span>Women's suits · jewellery · bags · accessories</span>
      </div>

      <header className="relative z-10 border-b border-border/70 bg-background">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a className="text-xs uppercase tracking-[0.1em] transition-colors hover:text-primary" href="#collections">
              Collections
            </a>
            <a className="text-xs uppercase tracking-[0.1em] transition-colors hover:text-primary" href="#shop">
              Shop all
            </a>
          </nav>

          <a className="absolute left-1/2 -translate-x-1/2 text-center" href="#top" aria-label="U M Collection home">
            <span className="block font-display text-[30px] leading-none">U M Collection</span>
            <span className="mt-1 block text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
              A little something special
            </span>
          </a>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={searchOpen ? "Close search" : "Search items"}
              onClick={() => {
                setSearchOpen((open) => !open);
                setTimeout(() => document.getElementById("shop-search")?.focus(), 0);
              }}
            >
              {searchOpen ? <X /> : <Search />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={favourites.length ? `${favourites.length} saved favourites` : "Favourites"}
              onClick={() => {
                setActiveCategory("All pieces");
                setQuery("");
                document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative hidden sm:inline-flex"
            >
              <Heart />
              {favourites.length > 0 && (
                <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                  {favourites.length}
                </span>
              )}
            </Button>
            <a
              href="#shop"
              aria-label="Browse the collection"
              className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent"
            >
              <ShoppingBag className="size-4" />
            </a>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="grid border-t border-border bg-background px-5 py-3 md:hidden" aria-label="Mobile navigation">
            {[
              ["Collections", "#collections"],
              ["Shop all", "#shop"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="border-b border-border/70 py-3 text-xs uppercase tracking-[0.1em] last:border-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        {searchOpen && (
          <div className="border-t border-border/70 px-5 py-3 sm:px-8 lg:px-14">
            <label className="mx-auto flex max-w-[1440px] items-center gap-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                id="shop-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
                placeholder="Search suits, jewellery, bags..."
                className="w-full border-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
              />
            </label>
          </div>
        )}
      </header>

      <section id="top" className="mx-auto grid max-w-[1440px] gap-7 px-5 pb-14 pt-7 sm:px-8 md:grid-cols-[0.88fr_1.12fr] md:gap-10 md:px-14 md:pb-20 md:pt-10 lg:gap-16">
        <div className="flex flex-col justify-center py-3 md:py-12">
          <p className="mb-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            The latest collection
          </p>
          <h1 className="max-w-[540px] font-display text-[52px] leading-[0.98] sm:text-[66px] lg:text-[76px]">
            A little more <span className="italic text-primary">you.</span>
          </h1>
          <p className="mt-5 max-w-[380px] text-sm leading-6 text-muted-foreground sm:text-base">
            Find something lovely: suits for the moments that matter, and little details to make them yours.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-none px-6 text-xs uppercase tracking-[0.12em]">
              <a href="#shop">
                Explore the collection <ArrowRight />
              </a>
            </Button>
            <a href="#collections" className="text-xs underline underline-offset-4 transition-colors hover:text-primary">
              Discover categories
            </a>
          </div>
          <div className="mt-10 hidden items-center gap-3 text-xs text-muted-foreground md:flex">
            <span className="h-px w-12 bg-primary" />
            <span>Thoughtful finds, beautifully worn</span>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden bg-secondary sm:min-h-[500px] md:min-h-[570px]">
          <img
            src={burgundySuit.url}
            alt="Model in a richly embroidered burgundy suit with traditional jewellery"
            className="absolute inset-0 size-full object-cover object-[center_30%]"
            fetchPriority="high"
          />
          <div className="absolute bottom-4 left-4 bg-background/95 px-4 py-3 sm:bottom-6 sm:left-6 sm:px-5">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Made to be remembered</p>
            <p className="mt-1 font-display text-2xl">The occasion edit</p>
          </div>
          <span className="absolute right-4 top-4 rounded-full bg-background/95 px-3 py-2 text-[9px] uppercase tracking-[0.1em] text-foreground sm:right-6 sm:top-6">
            U M Collection
          </span>
        </div>
      </section>

      <section id="collections" className="border-y border-border/70 bg-secondary/60 py-14 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">A little of everything</p>
              <h2 className="font-display text-4xl sm:text-5xl">Find your favourite</h2>
            </div>
            <a href="#shop" className="hidden items-center gap-2 pb-1 text-xs sm:inline-flex">
              Shop all <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { name: "Suits", image: burgundySuit.url, alt: "Burgundy embroidered women's suit" },
              { name: "Jewellery", image: pearlJewellery.url, alt: "Pearl jewellery set" },
              { name: "Handbags", image: miniHandbags.url, alt: "Small handbags in an assortment of colours" },
              { name: "Accessories", image: watchCollection.url, alt: "A collection of wristwatches" },
            ].map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => {
                  setActiveCategory(category.name === "Handbags" ? "Bags" : (category.name as Category));
                  setQuery("");
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative aspect-[0.86] overflow-hidden bg-card text-left"
              >
                <img
                  src={category.image}
                  alt={category.alt}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/95 px-3 py-3 text-sm sm:px-4 sm:py-4">
                  <span className="font-display text-xl sm:text-2xl">{category.name}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-16 lg:px-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Picked for you</p>
            <h2 className="font-display text-4xl sm:text-5xl">The shop</h2>
          </div>
          <p className="text-xs text-muted-foreground">A lovely little edit of what we have to offer.</p>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto border-b border-border/70 pb-3" aria-label="Filter by category">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={activeCategory === category ? "default" : "ghost"}
              size="sm"
              className="shrink-0 rounded-none px-3 text-xs"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {visibleProducts.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-9">
            {visibleProducts.map((product) => {
              const isFavourite = favourites.includes(product.name);

              return (
                <article key={product.name} className="group min-w-0">
                  <div className="relative aspect-[0.8] overflow-hidden bg-secondary">
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={isFavourite ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
                      aria-pressed={isFavourite}
                      onClick={() => toggleFavourite(product.name)}
                      className="absolute right-2 top-2 bg-background/90 hover:bg-background"
                    >
                      <Heart className={isFavourite ? "fill-primary text-primary" : ""} />
                    </Button>
                    <span className="absolute bottom-2 left-2 bg-background/95 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em]">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">{product.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">Explore the collection</p>
                    </div>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <p className="font-display text-3xl">Nothing found just yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Try another search or category.</p>
          </div>
        )}
      </section>

      <footer className="bg-ink text-primary-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
          <div>
            <a href="#top" className="font-display text-3xl">U M Collection</a>
            <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-primary-foreground/65">A little something special</p>
          </div>
          <a href="#collections" className="inline-flex items-center gap-2 text-xs transition-colors hover:text-primary">
            Back to collections <ArrowRight className="size-3.5" />
          </a>
        </div>
      </footer>
    </main>
  );
}