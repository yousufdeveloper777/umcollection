import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader, PageHeader, errMsg } from "@/components/admin/shared";
import { useRole } from "@/hooks/use-role";
import { categoriesQuery, contentQuery, type AboutContent, type HomeContent } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin/content")({ component: ContentPage });

function ContentPage() {
  const qc = useQueryClient();
  const { canEdit } = useRole();
  const home = useQuery(contentQuery<HomeContent>("home"));
  const about = useQuery(contentQuery<AboutContent>("about"));
  const { data: cats = [] } = useQuery(categoriesQuery);
  const [h, setH] = useState<HomeContent>({});
  const [a, setA] = useState<AboutContent>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (home.data) setH(home.data); }, [home.data]);
  useEffect(() => { if (about.data) setA(about.data); }, [about.data]);

  async function save(key: "home" | "about", value: HomeContent | AboutContent) {
    setBusy(true);
    const { error } = await supabase.from("site_content").upsert({ key, value, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Saved — live on your website now"); qc.invalidateQueries({ queryKey: ["content"] });
  }
  if (home.isLoading || about.isLoading) return <Skeleton className="h-96" />;
  const featured = h.featured_categories ?? [];
  return <div className="max-w-3xl space-y-6">
    <PageHeader title="Content" description="Edit the words and pictures on your homepage." />
    <fieldset disabled={!canEdit} className="space-y-6">
      <Card><CardHeader><CardTitle className="text-base">Hero banner</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label htmlFor="h-eyebrow">Small line above headline</Label><Input id="h-eyebrow" value={h.eyebrow ?? ""} onChange={e => setH({ ...h, eyebrow: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label htmlFor="h-headline">Headline</Label><Input id="h-headline" value={h.headline ?? ""} onChange={e => setH({ ...h, headline: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label htmlFor="h-sub">Subheadline</Label><Textarea id="h-sub" value={h.subheadline ?? ""} onChange={e => setH({ ...h, subheadline: e.target.value })} /></div>
        <div><Label htmlFor="h-cta">Button text</Label><Input id="h-cta" value={h.cta_text ?? ""} onChange={e => setH({ ...h, cta_text: e.target.value })} /></div>
        <div><Label htmlFor="h-link">Button link</Label><Input id="h-link" placeholder="/suits" value={h.cta_link ?? ""} onChange={e => setH({ ...h, cta_link: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Background image</Label><div className="mt-2"><ImageUploader multiple={false} folder="content" images={h.background_image ? [h.background_image] : []} primary={h.background_image} onChange={imgs => setH({ ...h, background_image: imgs[0] ?? "" })} /></div></div>
        <div className="sm:col-span-2"><Label>Featured categories</Label><div className="mt-2 flex flex-wrap gap-4">{cats.map(c => <label key={c.id} className="flex items-center gap-2 text-sm"><Checkbox checked={featured.includes(c.slug)} onCheckedChange={v => setH({ ...h, featured_categories: v ? [...featured, c.slug] : featured.filter(s => s !== c.slug) })} />{c.name}</label>)}</div></div>
        {canEdit && <Button className="sm:col-span-2 sm:justify-self-start" disabled={busy} onClick={() => save("home", h)}>Save homepage</Button>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">About U M Collection</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><Label htmlFor="a-title">Title</Label><Input id="a-title" value={a.title ?? ""} onChange={e => setA({ ...a, title: e.target.value })} /></div>
        <div><Label htmlFor="a-body">Text</Label><Textarea id="a-body" rows={6} value={a.body ?? ""} onChange={e => setA({ ...a, body: e.target.value })} /></div>
        {canEdit && <Button disabled={busy} onClick={() => save("about", a)}>Save about text</Button>}
      </CardContent></Card>
    </fieldset>
  </div>;
}
