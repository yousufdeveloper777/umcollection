import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { contentQuery, type AboutContent } from "@/lib/store-data";
import { pageHead } from "@/lib/page-head";
import editorial from "@/assets/collection-editorial.jpg";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/about")({ head: () => pageHead("/about", "About Us", "Meet U M Collection, a collection of women's suits, dresses and accessories for everyday and special occasions."), component: About });
function About() {
  const { data } = useQuery(contentQuery<AboutContent>("about"));
  return <main><section className="relative h-[420px] bg-ink"><img src={editorial} alt="U M Collection fashion editorial" className="size-full object-cover object-top" /><div className="absolute inset-0 bg-ink/45" /><div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-center px-5 text-paper"><p className="text-xs">OUR STORY</p><h1 className="mt-3 font-display text-6xl">About U M Collection</h1></div></section><section className="mx-auto max-w-3xl px-5 py-14"><h2 className="font-display text-4xl">{data?.title || "A little something special"}</h2><p className="mt-6 whitespace-pre-line text-sm leading-8 text-muted-foreground">{data?.body || "U M Collection brings together women's suits, dresses and accessories, from beautifully detailed occasion pieces to everyday favourites. Our collection celebrates personal style, with thoughtful finishing touches in jewellery, bags, watches and shoes."}</p><Button asChild className="mt-8 rounded-none"><Link to="/shop">Explore the collection</Link></Button></section></main>;
}