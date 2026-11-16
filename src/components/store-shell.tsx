import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const pages = [{ to: "/", label: "About U M Collection" }, { to: "/accessories", label: "Bags & Accessories" }, { to: "/suits", label: "Suits & Clothing" }] as const;

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  return <>
    <div className="bg-ink px-4 py-2 text-center text-[10px] text-gold">Women's suits · jewellery · bags · shoes · watches</div>
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-14">
        <Link to="/" className="shrink-0 font-display text-3xl sm:text-4xl">U M Collection</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">{pages.map(p => <Link key={p.to} to={p.to} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground border-primary" }} inactiveProps={{ className: "text-muted-foreground border-transparent" }} className="border-b pb-1 text-xs transition-colors hover:text-foreground">{p.label}</Link>)}</nav>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && <nav aria-label="Mobile navigation" className="grid border-t border-border px-5 md:hidden">{pages.map(p => <Link key={p.to} to={p.to} onClick={() => setOpen(false)} className="border-b border-border py-4 text-sm last:border-0">{p.label}</Link>)}</nav>}
    </header>
  </>;
}

export function StoreFooter() {
  return <footer className="bg-ink text-paper"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row lg:px-14"><div><Link to="/" className="font-display text-3xl">U M Collection</Link><p className="mt-2 text-xs text-paper/70">A little something special.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6">{pages.map(p => <Link key={p.to} to={p.to} className="inline-flex items-center gap-2 text-xs hover:text-gold">{p.label}<ArrowUpRight className="size-3" /></Link>)}</nav></div></footer>;
}
