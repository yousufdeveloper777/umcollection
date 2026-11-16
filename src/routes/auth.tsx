import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({ meta: [
    { title: "Sign in | U M Collection" },
    { name: "description", content: "Sign in to your U M Collection account." },
    { property: "og:title", content: "Sign in | U M Collection" },
    { property: "og:description", content: "Sign in to your U M Collection account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : undefined);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function routeSignedIn() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const target = safePath(redirect) ?? sessionStorage.getItem("auth-redirect") ?? undefined;
    sessionStorage.removeItem("auth-redirect");
    if (target) return navigate({ to: target, replace: true });
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: user.id });
    navigate({ to: staff ? "/admin" : "/", replace: true });
  }
  useEffect(() => {
    void routeSignedIn();
    const { data } = supabase.auth.onAuthStateChange(e => { if (e === "SIGNED_IN") void routeSignedIn(); });
    return () => data.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: form.name } } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (!data.session) toast.success("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
    }
  }
  async function oauth(provider: "google" | "lovable") {
    const p = safePath(redirect); if (p) sessionStorage.setItem("auth-redirect", p);
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  }

  return <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5 py-16">
    <h1 className="font-display text-5xl">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
    <p className="mt-2 text-sm text-muted-foreground">U M Collection</p>
    <div className="mt-8 grid gap-2">
      <Button type="button" variant="outline" onClick={() => oauth("google")} className="h-10 border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2] hover:text-[#1F1F1F]">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        Continue with Google
      </Button>
      <Button type="button" variant="outline" className="h-10" onClick={() => oauth("lovable")}><LovableMark className="size-[18px]" />Continue with Lovable</Button>
    </div>
    <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && <div><Label htmlFor="name">Full name</Label><Input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>}
      <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
      <Button type="submit" disabled={busy} className="w-full rounded-none">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
    </form>
    <Button variant="link" className="mt-3" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</Button>
  </main>;
}
