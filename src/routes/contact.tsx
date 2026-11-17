import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, ArrowUpRight } from "lucide-react";
import { pageHead } from "@/lib/page-head";
import { settingsQuery } from "@/lib/store-data";
import { contactSchema, contactMailto } from "@/lib/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export const Route = createFileRoute("/contact")({ head: () => pageHead("/contact", "Contact Us", "Contact U M Collection for product, sizing, shipping and order enquiries."), component: Contact });
function Contact() {
  const { data: settings } = useQuery(settingsQuery);
  const recipient = settings?.contact_email;
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  return <main className="mx-auto max-w-5xl px-5 py-14"><p className="text-xs text-muted-foreground">LET'S TALK</p><h1 className="mt-3 font-display text-5xl">Contact Us</h1><div className="mt-10 grid gap-12 md:grid-cols-2"><section><h2 className="font-display text-3xl">We'd love to hear from you</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Have a question about a piece, sizing or your order? Get in touch with U M Collection.</p><div className="mt-8 flex items-center gap-3"><Mail className="size-5 text-primary" /><div><p className="text-sm">{recipient || "Business email coming soon"}</p>{!recipient && <p className="mt-1 text-xs text-muted-foreground">hello@umcollection.com — proposed address, not active yet.</p>}</div></div></section><form onSubmit={e => { e.preventDefault(); const parsed = contactSchema.safeParse(form); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check your details"); return; } if (!recipient) { setError("Our business email is not active yet. Please check back soon."); return; } try { window.location.href = contactMailto(recipient, parsed.data); setError(""); } catch { setError("Email is currently unavailable."); } }} className="space-y-5"><div><Label htmlFor="contact-name">Name</Label><Input id="contact-name" required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><Label htmlFor="contact-email">Email</Label><Input id="contact-email" required type="email" maxLength={255} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div><Label htmlFor="contact-message">Message</Label><Textarea id="contact-message" required maxLength={2000} rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="rounded-none">Email enquiry<ArrowUpRight /></Button><p className="text-xs text-muted-foreground">Opens your email app; messages are not sent directly by this form.</p></form></div></main>;
}