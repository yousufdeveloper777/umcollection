import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight, User, LayoutDashboard, ShoppingBag, Instagram, Facebook } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";

const pages = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;
const collections = [
  { to: "/suits", label: "Suits" },
  { to: "/dresses", label: "Dresses" },
  { to: "/loungewear", label: "Loungewear" },
  { to: "/bags", label: "Bags" },
  { to: "/jewellery", label: "Jewellery" },
  { to: "/watches", label: "Watches" },
  { to: "/shoes", label: "Shoes" },
  { to: "/accessories", label: "Accessories" },
] as const;

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  return <>
    <div className="bg-ink px-4 py-2 text-center text-[10px] text-gold">Women's suits · dresses · jewellery · bags · shoes · watches</div>
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-14">
        <Link to="/" className="shrink-0 font-display text-3xl sm:text-4xl">U M Collection</Link>
        <nav aria-label="Main navigation" className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-2 md:flex">{pages.map(p => <Link key={p.to} to={p.to} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground border-primary" }} inactiveProps={{ className: "text-muted-foreground border-transparent" }} className="border-b pb-1 text-xs transition-colors hover:text-foreground">{p.label}</Link>)}</nav>
        <div className="flex items-center gap-1"><AccountLink /><CartLink /></div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && <nav aria-label="Mobile navigation" className="grid border-t border-border px-5 md:hidden">{pages.map(p => <Link key={p.to} to={p.to} onClick={() => setOpen(false)} className="border-b border-border py-4 text-sm last:border-0">{p.label}</Link>)}</nav>}
    </header>
  </>;
}

export function StoreFooter() {
  return <footer className="bg-ink text-paper"><div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] lg:px-14"><div><Link to="/" className="font-display text-3xl">U M Collection</Link><p className="mt-3 text-xs text-paper/70">A little something special.</p><div className="mt-5 flex gap-2"><Button asChild variant="ghost" size="icon" title="Ask for our Instagram"><Link to="/contact" aria-label="Instagram contact"><Instagram /></Link></Button><Button asChild variant="ghost" size="icon" title="Ask for our Facebook"><Link to="/contact" aria-label="Facebook contact"><Facebook /></Link></Button></div></div><nav aria-label="Collections" className="grid grid-cols-2 gap-3">{collections.map(p => <Link key={p.to} to={p.to} className="text-xs hover:text-gold">{p.label}</Link>)}</nav><nav aria-label="Footer navigation" className="flex flex-col items-start gap-3">{pages.map(p => <Link key={p.to} to={p.to} className="inline-flex items-center gap-2 text-xs hover:text-gold">{p.label}<ArrowUpRight className="size-3" /></Link>)}<Link to="/shipping-returns" className="text-xs hover:text-gold">Shipping & Returns</Link><Link to="/privacy" className="text-xs hover:text-gold">Privacy Policy</Link><Link to="/size-guide" className="text-xs hover:text-gold">Size Guide</Link></nav></div><div className="border-t border-paper/20 px-5 py-5 text-center text-[10px] text-paper/60">© U M Collection</div></footer>;
}

function AccountLink() {
  const { user, isStaff } = useRole();
  if (isStaff) return <Button asChild variant="outline" size="sm" className="rounded-none"><Link to="/admin"><LayoutDashboard /> Admin</Link></Button>;
  if (user) return <Button asChild variant="ghost" size="icon" aria-label="My account"><Link to="/account"><User /></Link></Button>;
  return <Button asChild variant="ghost" size="icon" aria-label="Sign in"><Link to="/auth" search={{ redirect: undefined }}><User /></Link></Button>;
}

function CartLink() {
  const { count } = useCart();
  return <Button asChild variant="ghost" size="icon" aria-label={`Cart, ${count} items`} className="relative"><Link to="/cart"><ShoppingBag />{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{count}</span>}</Link></Button>;
}
