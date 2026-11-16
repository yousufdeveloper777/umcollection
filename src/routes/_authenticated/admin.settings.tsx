import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader, PageHeader, errMsg } from "@/components/admin/shared";
import { useRole } from "@/hooks/use-role";
import { settingsQuery, type StoreSettings } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { canEdit } = useRole();
  const { data, isLoading } = useQuery(settingsQuery);
  const [s, setS] = useState<StoreSettings>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(data); }, [data]);
  async function save() {
    setBusy(true);
    const { error } = await supabase.from("store_settings").upsert({ id: 1, data: s, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] });
  }
  if (isLoading) return <Skeleton className="h-96" />;
  const field = (k: keyof StoreSettings, label: string, type = "text") => <div><Label htmlFor={`s-${k}`}>{label}</Label><Input id={`s-${k}`} type={type} value={String(s[k] ?? "")} onChange={e => setS({ ...s, [k]: type === "number" ? Number(e.target.value) : e.target.value })} /></div>;
  return <div className="max-w-3xl space-y-6">
    <PageHeader title="Settings" />
    <fieldset disabled={!canEdit} className="space-y-6">
      <Card><CardHeader><CardTitle className="text-base">Store information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        {field("store_name", "Store name")}{field("contact_email", "Contact email", "email")}{field("phone", "Phone number")}
        <div className="sm:col-span-2"><Label htmlFor="s-address">Address</Label><Textarea id="s-address" value={s.address ?? ""} onChange={e => setS({ ...s, address: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Logo</Label><div className="mt-2"><ImageUploader multiple={false} folder="logo" images={s.logo_url ? [s.logo_url] : []} primary={s.logo_url} onChange={imgs => setS({ ...s, logo_url: imgs[0] ?? "" })} /></div></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Shipping</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3">
        {field("flat_rate", "Flat rate (Rs)", "number")}{field("free_shipping_threshold", "Free shipping over (Rs)", "number")}{field("delivery_time", "Delivery time text")}
      </CardContent></Card>
      {canEdit && <Button disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</Button>}
    </fieldset>
    <Card><CardHeader><CardTitle className="text-base">Payments</CardTitle></CardHeader><CardContent className="flex items-center justify-between text-sm"><span>Online card payments</span><Badge variant="secondary">Not connected</Badge></CardContent><CardContent className="pt-0 text-sm text-muted-foreground">Orders are currently cash on delivery.</CardContent></Card>
  </div>;
}
